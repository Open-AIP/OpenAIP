from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal, InvalidOperation
import re
from typing import Any

from pypdf import PdfReader

from openaip_pipeline.core.artifact_contract import normalize_whitespace


_AMOUNT_PATTERN = re.compile(
    r"(?:(?:PHP|Php|php)\s*)?(?:\u20B1\s*)?((?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{2})?)"
)
_INVESTMENT_CONTEXT_PATTERN = re.compile(r"\b(investment|program|aip)\b", re.IGNORECASE)


@dataclass(frozen=True)
class _Candidate:
    keyword_rank: int
    confidence: int
    value: Decimal
    page_no: int
    evidence_text: str


def _to_lines(page_text: str) -> list[str]:
    return [normalize_whitespace(line) for line in page_text.splitlines() if normalize_whitespace(line)]


def _parse_decimal_amount(text: str) -> Decimal | None:
    matches = list(_AMOUNT_PATTERN.finditer(text))
    if not matches:
        return None

    # Prefer the right-most amount in a line such as "TOTAL ...: 77,092,531.00".
    raw_amount = matches[-1].group(1) or ""
    cleaned = raw_amount.replace(",", "").strip()
    if not cleaned:
        return None
    try:
        return Decimal(cleaned)
    except InvalidOperation:
        return None


def _keyword_rank(line_upper: str, context_upper: str) -> tuple[int, str] | None:
    if "TOTAL INVESTMENT PROGRAM" in line_upper:
        return 4, "TOTAL INVESTMENT PROGRAM"
    if "TOTAL INVESTMENT" in line_upper:
        return 3, "TOTAL INVESTMENT"
    if "GRAND TOTAL" in line_upper:
        return 2, "GRAND TOTAL"
    if "TOTAL:" in line_upper:
        if _INVESTMENT_CONTEXT_PATTERN.search(context_upper):
            return 1, "TOTAL:"
    return None


def _score_candidate(*, rank: int, amount_in_line: bool, keyword_text: str, context_has_investment: bool) -> int:
    score = rank * 100
    if amount_in_line:
        score += 20
    if keyword_text == "TOTAL INVESTMENT PROGRAM":
        score += 15
    if context_has_investment:
        score += 5
    return score


def _build_candidate(
    *,
    line: str,
    previous_line: str,
    next_line: str,
    page_no: int,
) -> _Candidate | None:
    line_upper = line.upper()
    context_text = " ".join(item for item in [previous_line, line, next_line] if item)
    context_upper = context_text.upper()
    rank_and_keyword = _keyword_rank(line_upper, context_upper)
    if rank_and_keyword is None:
        return None

    rank, keyword_text = rank_and_keyword
    amount = _parse_decimal_amount(line)
    amount_in_line = True
    if amount is None:
        amount = _parse_decimal_amount(context_text)
        amount_in_line = False
    if amount is None:
        return None

    evidence_parts = [part for part in [previous_line, line, next_line] if part]
    evidence_text = " | ".join(evidence_parts)[:400]
    confidence = _score_candidate(
        rank=rank,
        amount_in_line=amount_in_line,
        keyword_text=keyword_text,
        context_has_investment=bool(_INVESTMENT_CONTEXT_PATTERN.search(context_text)),
    )
    return _Candidate(
        keyword_rank=rank,
        confidence=confidence,
        value=amount,
        page_no=page_no,
        evidence_text=evidence_text,
    )


def _extract_best_candidate(pages_text: list[str]) -> _Candidate | None:
    candidates: list[_Candidate] = []
    for page_index, page_text in enumerate(pages_text):
        lines = _to_lines(page_text)
        for line_index, line in enumerate(lines):
            previous_line = lines[line_index - 1] if line_index > 0 else ""
            next_line = lines[line_index + 1] if line_index + 1 < len(lines) else ""
            candidate = _build_candidate(
                line=line,
                previous_line=previous_line,
                next_line=next_line,
                page_no=page_index + 1,
            )
            if candidate is None:
                continue
            candidates.append(candidate)

    if not candidates:
        return None

    candidates.sort(
        key=lambda item: (
            item.keyword_rank,
            item.confidence,
            item.value,
            -item.page_no,
        ),
        reverse=True,
    )
    return candidates[0]


def extract_totals_from_pages(
    *,
    pages_text: list[str],
    fiscal_year: int,
    barangay_name: str | None,
) -> list[dict[str, Any]]:
    best = _extract_best_candidate(pages_text)
    if best is None:
        return []

    normalized_name = normalize_whitespace(barangay_name) if barangay_name else None
    return [
        {
            "type": "AIP_TOTAL",
            "source_label": "total_investment_program",
            "fiscal_year": fiscal_year,
            "barangay_name": normalized_name,
            "barangay_id": None,
            "value": float(best.value),
            "currency": "PHP",
            "page_no": best.page_no,
            "evidence_text": best.evidence_text,
        }
    ]


def extract_totals_from_pdf(
    *,
    pdf_path: str,
    fiscal_year: int,
    barangay_name: str | None,
) -> list[dict[str, Any]]:
    reader = PdfReader(pdf_path)
    pages_text: list[str] = []
    for page in reader.pages:
        try:
            page_text = page.extract_text() or ""
        except Exception:
            page_text = ""
        pages_text.append(page_text)

    return extract_totals_from_pages(
        pages_text=pages_text,
        fiscal_year=fiscal_year,
        barangay_name=barangay_name,
    )
