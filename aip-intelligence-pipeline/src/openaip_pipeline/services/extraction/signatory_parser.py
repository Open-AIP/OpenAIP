from __future__ import annotations

import re
from dataclasses import dataclass
from statistics import median
from typing import Any

from pypdf import PdfReader

from openaip_pipeline.core.artifact_contract import make_source_ref, normalize_identifier, normalize_whitespace

ROLE_LABELS: dict[str, str] = {
    "preparedby": "prepared_by",
    "attestedby": "attested_by",
    "reviewedby": "reviewed_by",
    "approvedby": "approved_by",
}
ROLE_TOKENS = {"prepared", "approved", "reviewed", "attested"}
ROLE_LABEL_PATTERN = re.compile(
    r"\b(prepared\s*by|approved\s*by|reviewed\s*by|attested\s*by|preparedby|approvedby|reviewedby|attestedby)\b",
    re.IGNORECASE,
)
ROLE_REJECTION_PATTERN = re.compile(r"\b(prepared|approved|reviewed|attested|by)\b", re.IGNORECASE)
NON_LETTER_PATTERN = re.compile(r"[^A-Za-z]")
TRAILING_PUNCT_PATTERN = re.compile(r"[,:;.\-_]+$")
PAGE_NOISE_PATTERN = re.compile(r"^\s*page\s+\d+\s*$", re.IGNORECASE)

POSITION_MARKERS = (
    "treasurer",
    "secretary",
    "punong barangay",
    "barangay",
    "cpdc",
    "head",
    "officer",
    "budget",
    "chief",
    "executive",
    "administrator",
    "engineer",
    "planning",
    "captain",
    "chairperson",
    "councilor",
    "clerk",
)
CAPTURE_REGION_RATIO = 0.60
VERTICAL_POSITION_GAP_MAX = 32.0
COLUMN_X_PADDING = 8.0


@dataclass(frozen=True)
class PositionedWord:
    text: str
    x0: float
    x1: float
    y0: float
    y1: float
    page: int

    @property
    def y_mid(self) -> float:
        return (self.y0 + self.y1) / 2.0

    @property
    def width(self) -> float:
        return max(0.0, self.x1 - self.x0)

    @property
    def height(self) -> float:
        return max(0.0, self.y1 - self.y0)


@dataclass
class PositionedLine:
    text: str
    words: list[PositionedWord]
    x0: float
    x1: float
    y0: float
    y1: float
    y_mid: float


@dataclass(frozen=True)
class SignatoryAnchor:
    role: str
    label_text: str
    x0: float
    x1: float
    y0: float
    y1: float
    column_id: int | None = None

    @property
    def x_center(self) -> float:
        return (self.x0 + self.x1) / 2.0


@dataclass(frozen=True)
class ColumnBand:
    column_id: int
    x_min: float
    x_max: float
    x_center: float


def _clamp(value: float, lower: float, upper: float) -> float:
    return max(lower, min(upper, value))


def _letters_only_lower(value: str) -> str:
    return NON_LETTER_PATTERN.sub("", normalize_whitespace(value)).lower()


def _role_display(role: str) -> str:
    return role.replace("_", " ").upper()


def _detect_role_in_text(text: str) -> str | None:
    normalized = _letters_only_lower(text)
    if normalized in ROLE_LABELS:
        return ROLE_LABELS[normalized]
    return None


def normalize_name_text(text: str) -> str:
    value = normalize_whitespace(text)
    value = TRAILING_PUNCT_PATTERN.sub("", value).strip()
    return value


def normalize_position_text(text: str) -> str:
    value = normalize_whitespace(text)
    value = TRAILING_PUNCT_PATTERN.sub("", value).strip()
    return value


def is_valid_name_candidate(text: str) -> bool:
    value = normalize_name_text(text)
    if not value:
        return False
    lowered = value.lower()
    if ROLE_REJECTION_PATTERN.search(lowered):
        return False
    if PAGE_NOISE_PATTERN.match(value):
        return False
    if any(char.isdigit() for char in value):
        return False
    alpha_count = sum(1 for char in value if char.isalpha())
    compact_length = len(re.sub(r"\s+", "", value))
    if alpha_count < 3 or compact_length == 0:
        return False
    if alpha_count / compact_length < 0.55:
        return False
    tokens = [token for token in re.split(r"\s+", value) if token]
    if len(tokens) < 2:
        return False
    if len(tokens) > 8:
        return False
    if any(marker in lowered for marker in POSITION_MARKERS):
        return False
    return True


def is_position_candidate(text: str) -> bool:
    value = normalize_position_text(text)
    if not value:
        return False
    lowered = value.lower()
    if ROLE_REJECTION_PATTERN.search(lowered):
        return False
    if PAGE_NOISE_PATTERN.match(value):
        return False
    if is_valid_name_candidate(value):
        return False
    if sum(1 for char in value if char.isalpha()) < 4:
        return False
    return any(marker in lowered for marker in POSITION_MARKERS)


def infer_office_text(position_text: str | None) -> str | None:
    value = normalize_position_text(position_text or "")
    if not value:
        return None
    lowered = value.lower()
    if "cpdc" in lowered:
        return "CPDC"
    if "barangay" in lowered:
        return "Barangay Government"
    if "city" in lowered:
        return "City Government"
    if "municipal" in lowered or "municipality" in lowered:
        return "Municipal Government"
    if "local chief executive" in lowered:
        return "Executive Office"
    return None


def _safe_page_size(pdf_path: str, page_number_1_indexed: int) -> tuple[float, float]:
    try:
        reader = PdfReader(pdf_path)
        page = reader.pages[page_number_1_indexed - 1]
        return float(page.mediabox.width), float(page.mediabox.height)
    except Exception:
        return 612.0, 792.0


def extract_positioned_words(pdf_path: str, page_number_1_indexed: int) -> tuple[list[dict[str, Any]], float, float, bool]:
    try:
        import pdfplumber  # type: ignore
    except Exception:
        width, height = _safe_page_size(pdf_path, page_number_1_indexed)
        return [], width, height, False

    try:
        with pdfplumber.open(pdf_path) as pdf:
            page = pdf.pages[page_number_1_indexed - 1]
            page_width = float(page.width or 0.0)
            page_height = float(page.height or 0.0)
            raw_words = page.extract_words(
                use_text_flow=True,
                keep_blank_chars=False,
                x_tolerance=1,
                y_tolerance=2,
            )
            words: list[dict[str, Any]] = []
            for word in raw_words:
                text = normalize_whitespace(word.get("text"))
                if not text:
                    continue
                words.append(
                    {
                        "text": text,
                        "x0": float(word.get("x0") or 0.0),
                        "x1": float(word.get("x1") or 0.0),
                        "y0": float(word.get("top") or 0.0),
                        "y1": float(word.get("bottom") or 0.0),
                        "page": page_number_1_indexed,
                    }
                )
            has_text_layer = len(words) > 0
            if page_width <= 0 or page_height <= 0:
                fallback_width, fallback_height = _safe_page_size(pdf_path, page_number_1_indexed)
                page_width = fallback_width
                page_height = fallback_height
            return words, page_width, page_height, has_text_layer
    except Exception:
        width, height = _safe_page_size(pdf_path, page_number_1_indexed)
        return [], width, height, False


def _line_from_words(words: list[PositionedWord]) -> PositionedLine:
    ordered_words = sorted(words, key=lambda item: item.x0)
    text = normalize_whitespace(" ".join(word.text for word in ordered_words))
    x0 = min(word.x0 for word in ordered_words)
    x1 = max(word.x1 for word in ordered_words)
    y0 = min(word.y0 for word in ordered_words)
    y1 = max(word.y1 for word in ordered_words)
    return PositionedLine(
        text=text,
        words=ordered_words,
        x0=x0,
        x1=x1,
        y0=y0,
        y1=y1,
        y_mid=(y0 + y1) / 2.0,
    )


def group_words_into_lines(words: list[dict[str, Any]], page_height: float) -> list[PositionedLine]:
    del page_height
    positioned: list[PositionedWord] = []
    for item in words:
        text = normalize_whitespace(item.get("text"))
        if not text:
            continue
        positioned.append(
            PositionedWord(
                text=text,
                x0=float(item.get("x0") or 0.0),
                x1=float(item.get("x1") or 0.0),
                y0=float(item.get("y0") or 0.0),
                y1=float(item.get("y1") or 0.0),
                page=int(item.get("page") or 1),
            )
        )
    if not positioned:
        return []
    heights = [word.height for word in positioned if word.height > 0]
    median_height = median(heights) if heights else 8.0
    y_tolerance = max(2.5, float(median_height) * 0.8)
    ordered = sorted(positioned, key=lambda item: (item.y_mid, item.x0))
    lines: list[list[PositionedWord]] = []
    current: list[PositionedWord] = []
    current_y = 0.0
    for word in ordered:
        if not current:
            current = [word]
            current_y = word.y_mid
            continue
        if abs(word.y_mid - current_y) <= y_tolerance:
            current.append(word)
            current_y = sum(item.y_mid for item in current) / len(current)
            continue
        lines.append(current)
        current = [word]
        current_y = word.y_mid
    if current:
        lines.append(current)
    normalized_lines: list[PositionedLine] = []
    for chunk in lines:
        ordered_chunk = sorted(chunk, key=lambda item: item.x0)
        widths = [word.width for word in ordered_chunk if word.width > 0]
        median_width = median(widths) if widths else 12.0
        split_gap = max(24.0, float(median_width) * 3.5)
        current_split: list[PositionedWord] = []
        for word in ordered_chunk:
            if not current_split:
                current_split = [word]
                continue
            previous = current_split[-1]
            gap = word.x0 - previous.x1
            if gap > split_gap:
                normalized_lines.append(_line_from_words(current_split))
                current_split = [word]
                continue
            current_split.append(word)
        if current_split:
            normalized_lines.append(_line_from_words(current_split))
    normalized_lines.sort(key=lambda line: (line.y_mid, line.x0))
    return normalized_lines


def detect_label_anchors(lines: list[PositionedLine]) -> list[SignatoryAnchor]:
    anchors: list[SignatoryAnchor] = []
    for line in lines:
        line_anchors: list[SignatoryAnchor] = []
        words = line.words
        normalized_words = [_letters_only_lower(word.text) for word in words]
        index = 0
        while index < len(words):
            role: str | None = None
            end_index = index
            token = normalized_words[index]
            if token in ROLE_LABELS:
                role = ROLE_LABELS[token]
            elif token in ROLE_TOKENS and index + 1 < len(words) and normalized_words[index + 1] == "by":
                role = ROLE_LABELS[f"{token}by"]
                end_index = index + 1
            if role is None:
                index += 1
                continue
            span_words = words[index : end_index + 1]
            anchor = SignatoryAnchor(
                role=role,
                label_text=normalize_whitespace(" ".join(word.text for word in span_words)),
                x0=min(word.x0 for word in span_words),
                x1=max(word.x1 for word in span_words),
                y0=min(word.y0 for word in span_words),
                y1=max(word.y1 for word in span_words),
            )
            line_anchors.append(anchor)
            index = end_index + 1
        if line_anchors:
            prepared_or_approved = [item for item in line_anchors if item.role in {"prepared_by", "approved_by"}]
            if len(prepared_or_approved) >= 2:
                ordered = sorted(prepared_or_approved, key=lambda item: item.x0)
                leftmost = ordered[0]
                rightmost = ordered[-1]
                normalized_for_line: list[SignatoryAnchor] = []
                for item in line_anchors:
                    if item is leftmost:
                        normalized_for_line.append(
                            SignatoryAnchor(
                                role="prepared_by",
                                label_text=item.label_text,
                                x0=item.x0,
                                x1=item.x1,
                                y0=item.y0,
                                y1=item.y1,
                            )
                        )
                    elif item is rightmost:
                        normalized_for_line.append(
                            SignatoryAnchor(
                                role="approved_by",
                                label_text=item.label_text,
                                x0=item.x0,
                                x1=item.x1,
                                y0=item.y0,
                                y1=item.y1,
                            )
                        )
                    else:
                        normalized_for_line.append(item)
                line_anchors = normalized_for_line
        anchors.extend(line_anchors)
    deduped: list[SignatoryAnchor] = []
    seen: set[tuple[str, float, float]] = set()
    for anchor in anchors:
        key = (anchor.role, round(anchor.y0, 1), round(anchor.x0, 1))
        if key in seen:
            continue
        seen.add(key)
        deduped.append(anchor)
    return deduped


def cluster_columns_from_anchors(anchors: list[SignatoryAnchor], page_width: float) -> list[ColumnBand]:
    if page_width <= 0:
        page_width = 1000.0
    if not anchors:
        return [ColumnBand(column_id=0, x_min=0.0, x_max=page_width, x_center=page_width / 2.0)]
    centers = sorted(anchor.x_center for anchor in anchors)
    gap_threshold = page_width * 0.18
    clustered: list[list[float]] = [[centers[0]]]
    for value in centers[1:]:
        if abs(value - clustered[-1][-1]) <= gap_threshold:
            clustered[-1].append(value)
            continue
        clustered.append([value])
    cluster_centers = [sum(cluster) / len(cluster) for cluster in clustered]
    bands: list[ColumnBand] = []
    for index, center in enumerate(cluster_centers):
        left = 0.0 if index == 0 else (cluster_centers[index - 1] + center) / 2.0
        right = page_width if index == len(cluster_centers) - 1 else (center + cluster_centers[index + 1]) / 2.0
        bands.append(ColumnBand(column_id=index, x_min=left, x_max=right, x_center=center))
    return bands


def build_capture_region(anchor: SignatoryAnchor, column: ColumnBand, page_height: float) -> tuple[float, float, float, float]:
    effective_height = max(1.0, page_height)
    region_height = effective_height * CAPTURE_REGION_RATIO
    x_min = max(0.0, column.x_min - COLUMN_X_PADDING)
    x_max = column.x_max + COLUMN_X_PADDING
    y_min = max(0.0, anchor.y1)
    y_max = min(effective_height, y_min + region_height)
    return (x_min, x_max, y_min, y_max)


def _line_overlaps_region(line: PositionedLine, region: tuple[float, float, float, float]) -> bool:
    x_min, x_max, y_min, y_max = region
    x_center = (line.x0 + line.x1) / 2.0
    overlaps_x = x_center >= x_min and x_center <= x_max
    in_y = line.y_mid >= y_min and line.y_mid <= y_max
    return overlaps_x and in_y


def extract_name_position_pairs(lines: list[PositionedLine], role: str) -> list[dict[str, Any]]:
    del role
    if not lines:
        return []
    ordered = sorted(lines, key=lambda line: (line.y_mid, line.x0))
    pairs: list[dict[str, Any]] = []
    index = 0
    while index < len(ordered):
        line = ordered[index]
        candidate_name = normalize_name_text(line.text)
        if not is_valid_name_candidate(candidate_name):
            index += 1
            continue
        position_text: str | None = None
        if index + 1 < len(ordered):
            next_line = ordered[index + 1]
            vertical_gap = next_line.y0 - line.y1
            candidate_position = normalize_position_text(next_line.text)
            if vertical_gap <= VERTICAL_POSITION_GAP_MAX and is_position_candidate(candidate_position):
                position_text = candidate_position
                index += 1
        pairs.append(
            {
                "name_text": candidate_name,
                "position_text": position_text,
                "name_bbox": [line.x0, line.y0, line.x1, line.y1],
            }
        )
        index += 1
    deduped: list[dict[str, Any]] = []
    seen: set[tuple[str, str]] = set()
    for pair in pairs:
        key = (
            normalize_identifier(pair.get("name_text")) or "",
            normalize_identifier(pair.get("position_text")) or "",
        )
        if key in seen:
            continue
        seen.add(key)
        deduped.append(pair)
    return deduped


def _nearest_column(anchor: SignatoryAnchor, columns: list[ColumnBand]) -> ColumnBand:
    return min(columns, key=lambda column: abs(column.x_center - anchor.x_center))


def _column_for_anchor(
    *,
    anchor: SignatoryAnchor,
    anchors: list[SignatoryAnchor],
    fallback_column: ColumnBand,
    page_width: float,
) -> ColumnBand:
    same_row = sorted(
        [item for item in anchors if abs(item.y0 - anchor.y0) <= 12.0],
        key=lambda item: item.x_center,
    )
    if len(same_row) <= 1:
        return fallback_column
    current_index = next((idx for idx, item in enumerate(same_row) if item == anchor), None)
    if current_index is None:
        return fallback_column
    left = 0.0 if current_index == 0 else (same_row[current_index - 1].x_center + anchor.x_center) / 2.0
    right = (
        page_width
        if current_index == len(same_row) - 1
        else (anchor.x_center + same_row[current_index + 1].x_center) / 2.0
    )
    return ColumnBand(
        column_id=fallback_column.column_id,
        x_min=max(0.0, left),
        x_max=max(left, right),
        x_center=anchor.x_center,
    )


def _parse_signatories_from_positioned_lines(
    lines: list[PositionedLine],
    *,
    page_number: int,
    page_width: float,
    page_height: float,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    anchors = detect_label_anchors(lines)
    if not anchors:
        return [], []
    columns = cluster_columns_from_anchors(anchors, page_width=page_width)
    signatories: list[dict[str, Any]] = []
    warnings: list[dict[str, Any]] = []
    for anchor in anchors:
        fallback_column = _nearest_column(anchor, columns)
        column = _column_for_anchor(
            anchor=anchor,
            anchors=anchors,
            fallback_column=fallback_column,
            page_width=page_width,
        )
        base_region = build_capture_region(anchor, column, page_height=page_height)
        candidate_lines = [line for line in lines if _line_overlaps_region(line, base_region) and line.y_mid > anchor.y1]
        pairs = extract_name_position_pairs(candidate_lines, role=anchor.role)
        if not pairs:
            warnings.append(
                {
                    "code": "SIGNATORY_PARSE_FAILED",
                    "message": f"Found {anchor.role} label but no name extracted",
                    "details": {"role": anchor.role},
                    "source_refs": [
                        make_source_ref(
                            page=page_number,
                            kind="text_block",
                            evidence_text=anchor.label_text,
                        )
                    ],
                }
            )
            continue
        for pair in pairs:
            name_text = normalize_name_text(str(pair.get("name_text") or ""))
            if not is_valid_name_candidate(name_text):
                continue
            role_display = _role_display(anchor.role)
            signatories.append(
                {
                    "role": anchor.role,
                    "name_text": name_text,
                    "position_text": normalize_position_text(pair.get("position_text") or "") or None,
                    "office_text": infer_office_text(pair.get("position_text")),
                    "source_refs": [
                        make_source_ref(
                            page=page_number,
                            kind="text_block",
                            evidence_text=f"{role_display}: {name_text}",
                            bbox=pair.get("name_bbox"),
                        )
                    ],
                }
            )
    return signatories, warnings


def parse_signatories_from_positioned_words(
    words: list[dict[str, Any]],
    *,
    page_number: int,
    page_width: float,
    page_height: float,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    lines = group_words_into_lines(words, page_height=page_height)
    return _parse_signatories_from_positioned_lines(
        lines,
        page_number=page_number,
        page_width=page_width,
        page_height=page_height,
    )


def _build_text_only_line(line_text: str, index: int, page: int) -> PositionedLine:
    text = normalize_whitespace(line_text)
    x0 = 0.0
    x1 = float(max(1, len(text))) * 6.0
    y0 = float(index) * 14.0
    y1 = y0 + 9.0
    words = [
        PositionedWord(
            text=token,
            x0=x0 + idx * 10.0,
            x1=x0 + idx * 10.0 + max(8.0, len(token) * 4.0),
            y0=y0,
            y1=y1,
            page=page,
        )
        for idx, token in enumerate(text.split())
    ]
    if not words:
        words = [PositionedWord(text=text, x0=x0, x1=x1, y0=y0, y1=y1, page=page)]
    return PositionedLine(text=text, words=words, x0=x0, x1=x1, y0=y0, y1=y1, y_mid=(y0 + y1) / 2.0)


def parse_signatory_lines(lines: list[str], page: int) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    raw_lines = [normalize_whitespace(line) for line in lines if normalize_whitespace(line)]
    if not raw_lines:
        return [], []
    signatories: list[dict[str, Any]] = []
    warnings: list[dict[str, Any]] = []
    index = 0
    while index < len(raw_lines):
        current = raw_lines[index]
        role = _detect_role_in_text(current)
        if role is None:
            if ROLE_LABEL_PATTERN.search(current):
                matched = ROLE_LABEL_PATTERN.search(current)
                label_text = normalize_whitespace(matched.group(0)) if matched else current
                detected_role = _detect_role_in_text(label_text) or "other"
                warnings.append(
                    {
                        "code": "SIGNATORY_PARSE_FAILED",
                        "message": f"Found {detected_role} label but no name extracted",
                        "details": {"role": detected_role},
                        "source_refs": [make_source_ref(page=page, kind="text_block", evidence_text=current)],
                    }
                )
            index += 1
            continue
        buffer: list[str] = []
        cursor = index + 1
        while cursor < len(raw_lines):
            probe = raw_lines[cursor]
            if _detect_role_in_text(probe) is not None:
                break
            buffer.append(probe)
            cursor += 1
        buffer_lines = [_build_text_only_line(value, offset, page) for offset, value in enumerate(buffer)]
        pairs = extract_name_position_pairs(buffer_lines, role=role)
        if not pairs:
            warnings.append(
                {
                    "code": "SIGNATORY_PARSE_FAILED",
                    "message": f"Found {role} label but no name extracted",
                    "details": {"role": role},
                    "source_refs": [make_source_ref(page=page, kind="text_block", evidence_text=current)],
                }
            )
            index = cursor
            continue
        for pair in pairs:
            name_text = normalize_name_text(str(pair.get("name_text") or ""))
            if not is_valid_name_candidate(name_text):
                continue
            role_display = _role_display(role)
            position_text = normalize_position_text(pair.get("position_text") or "") or None
            signatories.append(
                {
                    "role": role,
                    "name_text": name_text,
                    "position_text": position_text,
                    "office_text": infer_office_text(position_text),
                    "source_refs": [
                        make_source_ref(
                            page=page,
                            kind="text_block",
                            evidence_text=f"{role_display}: {name_text}",
                            bbox=pair.get("name_bbox"),
                        )
                    ],
                }
            )
        index = cursor
    return signatories, warnings


def parse_signatories_on_page(pdf_path: str, page_number: int, fallback_page_text: str) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    words, page_width, page_height, has_text_layer = extract_positioned_words(
        pdf_path=pdf_path,
        page_number_1_indexed=page_number,
    )
    signatories: list[dict[str, Any]] = []
    warnings: list[dict[str, Any]] = []
    if words:
        parsed, parsed_warnings = parse_signatories_from_positioned_words(
            words,
            page_number=page_number,
            page_width=page_width,
            page_height=page_height,
        )
        signatories.extend(parsed)
        warnings.extend(parsed_warnings)

    if not signatories:
        fallback_lines = [line.strip() for line in fallback_page_text.splitlines() if line and line.strip()]
        fallback_signatories, fallback_warnings = parse_signatory_lines(fallback_lines, page=page_number)
        signatories.extend(fallback_signatories)
        warnings.extend(fallback_warnings)

    if not signatories and ROLE_LABEL_PATTERN.search(fallback_page_text):
        reason = "text_layer_missing" if not has_text_layer else "name_not_found"
        label_excerpt = normalize_whitespace(ROLE_LABEL_PATTERN.search(fallback_page_text).group(0))
        warnings.append(
            {
                "code": "SIGNATORY_PARSE_FAILED",
                "message": "Found signatory label but no name extracted",
                "details": {"reason": reason},
                "source_refs": [
                    make_source_ref(
                        page=page_number,
                        kind="text_block",
                        evidence_text=label_excerpt,
                    )
                ],
            }
        )

    deduped_signatories: dict[tuple[str, str, str], dict[str, Any]] = {}
    for entry in signatories:
        role = normalize_identifier(entry.get("role")) or "other"
        name = normalize_name_text(entry.get("name_text") or "")
        if not is_valid_name_candidate(name):
            continue
        position = normalize_position_text(entry.get("position_text") or "") or ""
        key = (role, name.lower(), position.lower())
        payload = {
            "role": role,
            "name_text": name,
            "position_text": position or None,
            "office_text": entry.get("office_text"),
            "source_refs": entry.get("source_refs") if isinstance(entry.get("source_refs"), list) else [],
        }
        existing = deduped_signatories.get(key)
        if existing is None:
            deduped_signatories[key] = payload
            continue
        merged_refs = {str(ref): ref for ref in [*existing.get("source_refs", []), *payload.get("source_refs", [])]}
        existing["source_refs"] = list(merged_refs.values())

    deduped_warnings: list[dict[str, Any]] = []
    warning_seen: set[str] = set()
    for warning in warnings:
        code = normalize_identifier(warning.get("code")) or "SIGNATORY_PARSE_FAILED"
        message = normalize_whitespace(warning.get("message"))
        refs = warning.get("source_refs") if isinstance(warning.get("source_refs"), list) else []
        ref_page = refs[0].get("page") if refs else page_number
        key = f"{code}|{message}|{ref_page}"
        if key in warning_seen:
            continue
        warning_seen.add(key)
        deduped_warnings.append(
            {
                "code": code,
                "message": message,
                "details": warning.get("details"),
                "source_refs": refs,
            }
        )
    return list(deduped_signatories.values()), deduped_warnings


def select_signatory_pages(pages_text: list[str]) -> list[int]:
    if not pages_text:
        return []
    selected: set[int] = {1, len(pages_text)}
    for page_index, text in enumerate(pages_text, start=1):
        if ROLE_LABEL_PATTERN.search(text or ""):
            selected.add(page_index)
    return sorted(selected)
