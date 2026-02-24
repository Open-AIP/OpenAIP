from __future__ import annotations

import re
from collections import defaultdict
from dataclasses import dataclass
from typing import Any, Literal

from pypdf import PdfReader

from openaip_pipeline.core.artifact_contract import make_source_ref, normalize_identifier, normalize_whitespace
from openaip_pipeline.core.clock import now_utc_iso
from openaip_pipeline.services.extraction.signatory_parser import (
    parse_signatories_on_page,
    parse_signatory_lines,
    select_signatory_pages,
)

Scope = Literal["city", "barangay"]

ROLE_LABELS: dict[str, str] = {
    "prepared by": "prepared_by",
    "attested by": "attested_by",
    "reviewed by": "reviewed_by",
    "approved by": "approved_by",
}
ROLE_LABEL_PATTERN = re.compile(r"^\s*(prepared by|attested by|reviewed by|approved by)\s*:\s*$", re.IGNORECASE)
ROLE_LABEL_INLINE_PATTERN = re.compile(r"(prepared by|attested by|reviewed by|approved by)\s*:", re.IGNORECASE)
JURISDICTION_BASE_SCORES: dict[str, int] = {
    "barangay": 110,
    "municipality": 90,
    "city": 90,
    "province": 45,
    "region": 30,
}
JURISDICTION_SPECIFICITY: dict[str, int] = {
    "barangay": 4,
    "municipality": 3,
    "city": 3,
    "province": 2,
    "region": 1,
}
WORD_TOKEN_PATTERN = re.compile(r"[A-Za-z][A-Za-z'.-]*")
BARANGAY_MARKER_PATTERN = re.compile(r"\bbarangay\b", re.IGNORECASE)
MUNICIPALITY_MARKER_PATTERN = re.compile(r"\bmunicipality of\b", re.IGNORECASE)
CITY_MARKER_PATTERN = re.compile(r"\bcity of\b", re.IGNORECASE)
PROVINCE_MARKER_PATTERN = re.compile(r"\bprovince of\b", re.IGNORECASE)
REGION_PATTERN = re.compile(r"\bregion\s+([ivxlcdm0-9-]+)\b", re.IGNORECASE)
BARANGAY_NAME_STOPWORDS: set[str] = {
    "and",
    "for",
    "of",
    "use",
    "annual",
    "investment",
    "program",
    "fy",
    "general",
    "fund",
    "hall",
    "assembly",
    "day",
    "treasurer",
    "secretary",
    "punong",
    "chairperson",
    "captain",
    "staff",
    "officials",
    "members",
    "office",
    "offices",
    "building",
    "buildings",
    "vehicles",
    "vehicle",
    "constituents",
    "sangguniang",
    "tanod",
    "pambarangay",
    "katarungang",
    "received",
    "paid",
    "distributed",
    "construction",
}
LOCALITY_NAME_STOPWORDS: set[str] = {
    "annual",
    "investment",
    "program",
    "fy",
    "barangay",
    "province",
    "region",
}
TEMPLATE_PATTERNS: dict[str, re.Pattern[str]] = {
    "BAIP": re.compile(r"\bBAIP\b|BARANGAY\s+ANNUAL\s+INVESTMENT\s+PROGRAM", re.IGNORECASE),
    "AIP": re.compile(r"\bAIP\b|ANNUAL\s+INVESTMENT\s+PROGRAM", re.IGNORECASE),
}
YEAR_PATTERN = re.compile(r"\b(20\d{2}|2100)\b")


@dataclass(frozen=True)
class _LguCandidate:
    type: str
    name: str
    score: int
    source_refs: list[dict[str, Any]]


def _to_lines(page_text: str) -> list[str]:
    return [line.strip() for line in page_text.splitlines() if line and line.strip()]


def _line_kind(line_index: int, total_lines: int) -> Literal["header", "footer", "text_block"]:
    if total_lines <= 0:
        return "text_block"
    if line_index <= 3:
        return "header"
    if line_index >= max(0, total_lines - 3):
        return "footer"
    return "text_block"


def _dedupe_items(values: list[str]) -> list[str]:
    deduped: list[str] = []
    seen: set[str] = set()
    for value in values:
        key = normalize_whitespace(value).lower()
        if not key or key in seen:
            continue
        seen.add(key)
        deduped.append(normalize_whitespace(value))
    return deduped


def _format_name_tokens(tokens: list[str]) -> str:
    formatted: list[str] = []
    for token in tokens:
        cleaned = normalize_whitespace(token).strip(".,-")
        if not cleaned:
            continue
        if re.fullmatch(r"[IVXLCDM]+", cleaned.upper()):
            formatted.append(cleaned.upper())
            continue
        formatted.append(cleaned.title())
    return normalize_whitespace(" ".join(formatted))


def _extract_name_after_offset(
    line: str,
    *,
    start_offset: int,
    max_tokens: int,
    stopwords: set[str],
) -> str | None:
    tail = line[start_offset:]
    tail = re.sub(r"^[\s:,\-()]+", "", tail)
    if not tail:
        return None
    tokens = WORD_TOKEN_PATTERN.findall(tail)
    if not tokens:
        return None
    collected: list[str] = []
    for token in tokens:
        cleaned = normalize_whitespace(token).strip(".,-")
        if not cleaned:
            continue
        lowered = cleaned.lower()
        if lowered in stopwords:
            if collected:
                break
            return None
        if len(cleaned) == 1 and cleaned.upper() not in {"I", "V", "X"}:
            if not collected:
                return None
            break
        if any(char.isdigit() for char in cleaned):
            if collected:
                break
            return None
        collected.append(cleaned)
        if len(collected) >= max_tokens:
            break
    if not collected:
        return None
    return _format_name_tokens(collected)


def _extract_barangay_candidates_from_line(line: str) -> list[str]:
    values: list[str] = []
    for match in BARANGAY_MARKER_PATTERN.finditer(line):
        name = _extract_name_after_offset(
            line,
            start_offset=match.end(),
            max_tokens=3,
            stopwords=BARANGAY_NAME_STOPWORDS,
        )
        if not name:
            continue
        values.append(f"Barangay {name}")
    return _dedupe_items(values)


def _extract_prefixed_candidates_from_line(
    line: str,
    *,
    marker_pattern: re.Pattern[str],
    prefix: str,
) -> list[str]:
    values: list[str] = []
    for match in marker_pattern.finditer(line):
        name = _extract_name_after_offset(
            line,
            start_offset=match.end(),
            max_tokens=4,
            stopwords=LOCALITY_NAME_STOPWORDS,
        )
        if not name:
            continue
        values.append(f"{prefix} {name}")
    return _dedupe_items(values)


def _extract_region_candidates_from_line(line: str) -> list[str]:
    values: list[str] = []
    for match in REGION_PATTERN.finditer(line):
        region_token = normalize_whitespace(match.group(1)).upper()
        if not region_token:
            continue
        values.append(f"Region {region_token}")
    return _dedupe_items(values)


def _extract_lgu_candidates_from_line(line: str) -> list[tuple[str, str]]:
    normalized_line = normalize_whitespace(line)
    if not normalized_line:
        return []
    candidates: list[tuple[str, str]] = []
    for name in _extract_barangay_candidates_from_line(normalized_line):
        candidates.append(("barangay", name))
    for name in _extract_prefixed_candidates_from_line(
        normalized_line,
        marker_pattern=MUNICIPALITY_MARKER_PATTERN,
        prefix="Municipality of",
    ):
        candidates.append(("municipality", name))
    for name in _extract_prefixed_candidates_from_line(
        normalized_line,
        marker_pattern=CITY_MARKER_PATTERN,
        prefix="City of",
    ):
        candidates.append(("city", name))
    for name in _extract_prefixed_candidates_from_line(
        normalized_line,
        marker_pattern=PROVINCE_MARKER_PATTERN,
        prefix="Province of",
    ):
        candidates.append(("province", name))
    for name in _extract_region_candidates_from_line(normalized_line):
        candidates.append(("region", name))

    deduped: list[tuple[str, str]] = []
    seen: set[tuple[str, str]] = set()
    for item in candidates:
        key = (item[0], normalize_whitespace(item[1]).lower())
        if key in seen:
            continue
        seen.add(key)
        deduped.append(item)
    return deduped


def _candidate_score(
    *,
    candidate_type: str,
    candidate_name: str,
    line: str,
    line_kind: Literal["header", "footer", "text_block"],
    page_index: int,
) -> int:
    score = JURISDICTION_BASE_SCORES.get(candidate_type, 0)
    if line_kind in {"header", "footer"}:
        score += 14
    if page_index == 0:
        score += 8
    normalized_line = normalize_whitespace(line)
    normalized_name = normalize_whitespace(candidate_name)
    if normalized_line.lower() == normalized_name.lower():
        score += 18
    if normalized_line.isupper():
        score += 7
    lowered = normalized_line.lower()
    if "annual investment program" in lowered:
        score += 6
    if "fy" in lowered or YEAR_PATTERN.search(normalized_line):
        score += 4
    if candidate_type == "barangay" and any(token in lowered for token in {"constituents", "hall", "assembly", "treasurer"}):
        score -= 5
    return score


def _is_role_label(value: str) -> bool:
    lowered = normalize_whitespace(value).lower()
    if not lowered:
        return False
    if lowered.endswith(":"):
        lowered = lowered[:-1].strip()
    return lowered in ROLE_LABELS


def _looks_like_generic_heading(value: str) -> bool:
    text = normalize_whitespace(value)
    if not text:
        return True
    lowered = text.lower()
    if _is_role_label(lowered):
        return True
    if lowered.endswith(":"):
        return True
    generic_tokens = {
        "annual investment program",
        "aip",
        "baip",
        "funding source",
        "signature over printed name",
        "position",
    }
    if lowered in generic_tokens:
        return True
    return False


def _is_plausible_name_line(value: str) -> bool:
    text = normalize_whitespace(value)
    if not text:
        return False
    if text.endswith(":"):
        return False
    if _is_role_label(text):
        return False
    if ":" in text and len(text.split(":", 1)[0].split()) <= 3:
        return False
    return len(text.split()) >= 2


def _is_position_line(value: str) -> bool:
    text = normalize_whitespace(value)
    if not text:
        return False
    if _is_role_label(text):
        return False
    lower = text.lower()
    position_markers = (
        "punong",
        "barangay",
        "treasurer",
        "secretary",
        "chairperson",
        "captain",
        "officer",
        "chairman",
        "councilor",
        "municipal",
        "city",
    )
    return any(marker in lower for marker in position_markers)


def parse_signatory_block(lines: list[str], page: int) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    return parse_signatory_lines(lines, page=page)


def resolve_lgu_metadata(
    pages_text: list[str],
    pages_structured: list[dict[str, Any]] | None,
) -> tuple[dict[str, Any], dict[str, Any], list[dict[str, Any]]]:
    del pages_structured  # reserved for future OCR/structured integration
    candidate_accumulator: dict[tuple[str, str], dict[str, Any]] = defaultdict(
        lambda: {"score": 0, "source_refs": []}
    )

    for page_index, page_text in enumerate(pages_text):
        lines = _to_lines(page_text)
        for line_index, line in enumerate(lines):
            kind = _line_kind(line_index, len(lines))
            for candidate_type, candidate_name in _extract_lgu_candidates_from_line(line):
                key = (candidate_type, candidate_name)
                entry = candidate_accumulator[key]
                entry["score"] += _candidate_score(
                    candidate_type=candidate_type,
                    candidate_name=candidate_name,
                    line=line,
                    line_kind=kind,
                    page_index=page_index,
                )
                entry["source_refs"].append(
                    make_source_ref(
                        page=page_index + 1,
                        kind=kind,
                        evidence_text=normalize_whitespace(line),
                    )
                )

    candidates: list[_LguCandidate] = []
    for (candidate_type, candidate_name), values in candidate_accumulator.items():
        refs = values["source_refs"] if isinstance(values.get("source_refs"), list) else []
        deduped_refs = list({str(ref): ref for ref in refs}.values())
        candidates.append(
            _LguCandidate(
                type=candidate_type,
                name=candidate_name,
                score=int(values.get("score") or 0),
                source_refs=deduped_refs,
            )
        )

    warnings: list[dict[str, Any]] = []
    if not candidates:
        warnings.append(
            {
                "code": "LGU_NAME_MISSING",
                "message": "No jurisdiction markers detected in document text.",
                "details": {"selected": {"type": "unknown", "name": "Unknown LGU"}},
                "source_refs": [],
            }
        )
        lgu = {"name": "Unknown LGU", "type": "unknown", "confidence": "low"}
    else:
        sorted_candidates = sorted(
            candidates,
            key=lambda item: (
                -JURISDICTION_SPECIFICITY.get(item.type, 0),
                -item.score,
                normalize_whitespace(item.name).lower(),
            ),
        )
        selected = sorted_candidates[0]

        # Enforce "most specific jurisdiction wins"
        if any(candidate.type == "barangay" for candidate in sorted_candidates):
            barangay_candidates = [candidate for candidate in sorted_candidates if candidate.type == "barangay"]
            selected = sorted(
                barangay_candidates,
                key=lambda item: (-item.score, normalize_whitespace(item.name).lower()),
            )[0]

        same_type = [candidate for candidate in sorted_candidates if candidate.type == selected.type]
        competitor_candidates = [
            candidate
            for candidate in same_type
            if candidate.name != selected.name and (selected.score - candidate.score) <= 20
        ]
        if competitor_candidates:
            warning_refs = list({str(ref): ref for ref in selected.source_refs}.values())
            for candidate in competitor_candidates[:2]:
                for ref in candidate.source_refs:
                    key = str(ref)
                    if key not in {str(existing) for existing in warning_refs}:
                        warning_refs.append(ref)
            warnings.append(
                {
                    "code": "LGU_AMBIGUOUS",
                    "message": "Multiple jurisdiction candidates were detected with similar confidence.",
                    "details": {
                        "candidates": [
                            {
                                "type": candidate.type,
                                "name": candidate.name,
                                "score": candidate.score,
                                "source_refs": candidate.source_refs,
                            }
                            for candidate in sorted_candidates
                        ],
                        "selected": {"type": selected.type, "name": selected.name},
                    },
                    "source_refs": warning_refs or [],
                }
            )

        if len(sorted_candidates) == 1:
            confidence = "high"
        else:
            nearest_competitor_score = max(
                (
                    candidate.score
                    for candidate in sorted_candidates
                    if candidate.name != selected.name
                    and JURISDICTION_SPECIFICITY.get(candidate.type, 0)
                    == JURISDICTION_SPECIFICITY.get(selected.type, 0)
                ),
                default=0,
            )
            score_gap = selected.score - nearest_competitor_score
            if score_gap >= 25:
                confidence = "high"
            elif score_gap >= 8:
                confidence = "medium"
            else:
                confidence = "low"
        if warnings:
            confidence = "low" if confidence == "high" else confidence

        selected_type = selected.type if selected.type in {"barangay", "city", "municipality"} else "unknown"
        lgu = {"name": selected.name, "type": selected_type, "confidence": confidence}

    template_hits: dict[str, list[dict[str, Any]]] = {"BAIP": [], "AIP": []}
    for page_index, page_text in enumerate(pages_text):
        for template_type, pattern in TEMPLATE_PATTERNS.items():
            for match in pattern.finditer(page_text):
                template_hits[template_type].append(
                    make_source_ref(
                        page=page_index + 1,
                        kind="header" if page_index == 0 else "text_block",
                        evidence_text=normalize_whitespace(match.group(0)),
                    )
                )
    baip_count = len(template_hits["BAIP"])
    aip_count = len(template_hits["AIP"])
    if baip_count == 0 and aip_count == 0:
        document_type = "unknown"
    elif baip_count > aip_count:
        document_type = "BAIP"
    elif aip_count > baip_count:
        document_type = "AIP"
    else:
        # deterministic tie-break: BAIP if barangay marker exists, else AIP
        document_type = "BAIP" if lgu.get("type") == "barangay" else "AIP"
        warnings.append(
            {
                "code": "DOC_TYPE_AMBIGUOUS",
                "message": "Both BAIP and AIP anchors were detected with equal frequency.",
                "details": {"baip_hits": baip_count, "aip_hits": aip_count, "selected": document_type},
                "source_refs": [*(template_hits["BAIP"][:2]), *(template_hits["AIP"][:2])],
            }
        )

    source = {"document_type": document_type, "template_anchor_refs": template_hits.get(document_type, [])}
    return lgu, source, warnings


def _infer_fiscal_year(pages: list[str]) -> tuple[int, list[dict[str, Any]]]:
    all_matches: list[tuple[int, int]] = []
    for page_index, text in enumerate(pages):
        for match in YEAR_PATTERN.finditer(text):
            all_matches.append((int(match.group(1)), page_index + 1))
    if not all_matches:
        fallback = int(now_utc_iso()[:4])
        return (
            fallback,
            [
                {
                    "code": "FISCAL_YEAR_MISSING",
                    "message": f"No fiscal year detected from PDF text; defaulted to {fallback}.",
                    "details": {"selected": fallback},
                    "source_refs": [],
                }
            ],
        )

    counts: dict[int, int] = defaultdict(int)
    pages_by_year: dict[int, list[int]] = defaultdict(list)
    for year, page in all_matches:
        counts[year] += 1
        pages_by_year[year].append(page)
    ordered = sorted(counts.items(), key=lambda item: (-item[1], item[0]))
    selected_year = ordered[0][0]
    warnings: list[dict[str, Any]] = []
    if len(ordered) > 1 and ordered[0][1] == ordered[1][1]:
        warnings.append(
            {
                "code": "FISCAL_YEAR_AMBIGUOUS",
                "message": "Multiple fiscal-year candidates detected with same frequency.",
                "details": {
                    "candidates": [{"year": year, "count": count} for year, count in ordered],
                    "selected": selected_year,
                },
                "source_refs": [
                    make_source_ref(page=page, kind="header", evidence_text=str(selected_year))
                    for page in sorted(set(pages_by_year[selected_year]))[:3]
                ],
            }
        )
    return selected_year, warnings


def _extract_signatories(pdf_path: str, pages: list[str]) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    if not pages or not pdf_path:
        return [], []
    all_entries: list[dict[str, Any]] = []
    warnings: list[dict[str, Any]] = []
    for page_number in select_signatory_pages(pages):
        fallback_text = pages[page_number - 1] if 0 <= page_number - 1 < len(pages) else ""
        entries, page_warnings = parse_signatories_on_page(
            pdf_path=pdf_path,
            page_number=page_number,
            fallback_page_text=fallback_text,
        )
        all_entries.extend(entries)
        warnings.extend(page_warnings)
    deduped: dict[tuple[str, str, str], dict[str, Any]] = {}
    for entry in all_entries:
        key = (
            normalize_identifier(entry.get("role")) or "other",
            normalize_identifier(entry.get("name_text")) or "",
            normalize_identifier(entry.get("position_text")) or "",
        )
        existing = deduped.get(key)
        if existing is None:
            deduped[key] = entry
            continue
        existing_refs = existing.get("source_refs") if isinstance(existing.get("source_refs"), list) else []
        incoming_refs = entry.get("source_refs") if isinstance(entry.get("source_refs"), list) else []
        merged = {str(ref): ref for ref in [*existing_refs, *incoming_refs]}
        existing["source_refs"] = list(merged.values())
    return list(deduped.values()), warnings


def extract_document_metadata(
    pdf_path: str,
    *,
    scope: Scope,
    page_count_hint: int | None = None,
) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    reader = PdfReader(pdf_path)
    page_count = page_count_hint if isinstance(page_count_hint, int) and page_count_hint > 0 else len(reader.pages)
    pages: list[str] = []
    pages_structured: list[dict[str, Any]] = []
    for page in reader.pages:
        try:
            text = page.extract_text() or ""
        except Exception:
            text = ""
        lines = _to_lines(text)
        pages.append(text)
        pages_structured.append({"lines": lines})

    fiscal_year, year_warnings = _infer_fiscal_year(pages)
    lgu, source_info, lgu_warnings = resolve_lgu_metadata(pages, pages_structured)
    if lgu.get("type") == "unknown" and normalize_identifier(lgu.get("name")) and lgu.get("name") != "Unknown LGU":
        inferred_type = "barangay" if scope == "barangay" else "city"
        lgu["type"] = inferred_type
        lgu_warnings.append(
            {
                "code": "LGU_TYPE_INFERRED_FROM_SCOPE",
                "message": "LGU name was detected but type was ambiguous; inferred from pipeline scope.",
                "details": {"selected_type": inferred_type},
                "source_refs": [],
            }
        )
    signatories, signatory_warnings = _extract_signatories(pdf_path, pages)
    if source_info.get("document_type") == "unknown":
        source_info["document_type"] = "BAIP" if scope == "barangay" else "AIP"
    document = {
        "lgu": lgu,
        "fiscal_year": fiscal_year,
        "source": {
            "document_type": source_info.get("document_type", "unknown"),
            "page_count": page_count if page_count > 0 else None,
        },
    }
    if signatories:
        document["signatories"] = signatories
    warnings = [*year_warnings, *lgu_warnings, *signatory_warnings]
    return document, warnings
