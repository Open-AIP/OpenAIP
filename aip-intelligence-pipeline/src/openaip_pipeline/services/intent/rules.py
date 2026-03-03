from __future__ import annotations

import re

from .text_norm import is_effectively_empty, normalize_text

_LINE_ITEM_REF_PATTERN = re.compile(
    r"\bref\b(?:[\s:-]+)(?:[a-z0-9]{2,})(?:[\s:-]+[a-z0-9]{2,})+"
)
_LINE_ITEM_CODE_PHRASE_PATTERN = re.compile(r"\b(?:ref code|reference number|project code)\b")
_LINE_ITEM_CODE_TOKEN_PATTERN = re.compile(r"\b[a-z0-9]+(?:-[a-z0-9]+)*\b")

_AGGREGATION_CUES = ("grand total", "total", "sum", "overall")
_TOTAL_DOMAIN_CUES = ("aip", "budget", "investment", "projects", "programs")

_CATEGORY_DIMENSION_CUES = (
    "sector",
    "sectors",
    "fund source",
    "fund sources",
    "funding source",
    "funding sources",
    "source of funds",
    "sources of funds",
    "category",
    "categories",
)
_CATEGORY_PRESENTATION_CUES = (
    "by",
    "per",
    "breakdown",
    "distribution",
    "list",
    "show",
    "what are",
    "what is",
    "give",
    "provide",
    "exist",
    "available",
)

_SCOPE_AMBIGUOUS_CUES = (
    "which barangay is this",
    "which barangay is this for",
    "which city is this",
    "which city is this for",
    "which city should i check",
    "which municipality should i check",
    "which barangay has this project",
    "which barangay has that project",
    "anong barangay ito",
    "anong siyudad ito",
    "what city do you mean",
    "what barangay do you mean",
    "saan ito",
    "for that city",
    "for that barangay",
    "check this municipality",
    "show me the budget there",
    "compare that place to ours",
)
_SCOPE_QUALIFIERS = ("barangay", "city", "municipality", "munisipyo")


def match_line_item_ref(text: str) -> bool:
    normalized = normalize_text(text)
    if is_effectively_empty(normalized):
        return False

    if _LINE_ITEM_REF_PATTERN.search(normalized):
        return True

    phrase_match = _LINE_ITEM_CODE_PHRASE_PATTERN.search(normalized)
    if not phrase_match:
        return False

    trailing = normalized[phrase_match.end() :]
    code_match = _LINE_ITEM_CODE_TOKEN_PATTERN.search(trailing)
    if not code_match:
        return False

    code_token = code_match.group(0)
    return any(character.isdigit() for character in code_token)


def match_total_aggregation(text: str) -> bool:
    normalized = normalize_text(text)
    if is_effectively_empty(normalized):
        return False

    if any(cue in normalized for cue in _CATEGORY_DIMENSION_CUES):
        return False

    has_aggregation_cue = any(cue in normalized for cue in _AGGREGATION_CUES)
    if not has_aggregation_cue:
        return False

    return any(cue in normalized for cue in _TOTAL_DOMAIN_CUES)


def match_category_aggregation(text: str) -> bool:
    normalized = normalize_text(text)
    if is_effectively_empty(normalized):
        return False

    if not any(cue in normalized for cue in _CATEGORY_DIMENSION_CUES):
        return False

    if any(cue in normalized for cue in _CATEGORY_PRESENTATION_CUES):
        return True

    return any(cue in normalized for cue in _TOTAL_DOMAIN_CUES)


def match_scope_needs_clarification(text: str) -> bool:
    normalized = normalize_text(text)
    if is_effectively_empty(normalized):
        return False

    if any(cue in normalized for cue in _SCOPE_AMBIGUOUS_CUES):
        return True

    if "poblacion" not in normalized:
        return False

    return not any(qualifier in normalized for qualifier in _SCOPE_QUALIFIERS)
