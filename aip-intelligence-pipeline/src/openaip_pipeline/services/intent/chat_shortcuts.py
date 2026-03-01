from __future__ import annotations

import re

from .text_norm import is_effectively_empty, normalize_text
from .types import IntentResult, IntentType

_YEAR_CUE_PATTERN = re.compile(r"\b20\d{2}\b")
_PHRASE_CUES = ("line item",)
_TERM_CUES = (
    "aip",
    "budget",
    "investment",
    "total",
    "sum",
    "project",
    "program",
    "activity",
    "barangay",
    "city",
)
_REF_TOKEN_PATTERN = re.compile(r"\bref\b")


def contains_domain_cues(text: str) -> bool:
    normalized = normalize_text(text)
    if is_effectively_empty(normalized):
        return False

    if any(cue in normalized for cue in _PHRASE_CUES):
        return True

    if _YEAR_CUE_PATTERN.search(normalized):
        return True

    if _REF_TOKEN_PATTERN.search(normalized):
        return True

    return any(cue in normalized for cue in _TERM_CUES)


def maybe_handle_conversational_intent(
    text: str,
    intent_result: IntentResult,
) -> dict[str, str] | None:
    if intent_result.intent is IntentType.GREETING and not contains_domain_cues(text):
        return {
            "message": (
                "Hi! I can help with published AIP totals, line items, and project details. "
                "What barangay/city and year should I check?"
            )
        }

    if intent_result.intent is IntentType.THANKS and not contains_domain_cues(text):
        return {
            "message": (
                "You're welcome! If you want, tell me the barangay/city + year and what you "
                "want to check in the AIP."
            )
        }

    if intent_result.intent is IntentType.COMPLAINT:
        return {
            "message": (
                "Thanks for flagging that. Which part looks incorrect (barangay/city, year, or "
                "project/ref code) so I can re-check using the published AIP data?"
            )
        }

    if intent_result.intent is IntentType.CLARIFY:
        return {
            "message": (
                "Sure, tell me the barangay/city, year, and (if available) the ref code or "
                "project name you mean."
            )
        }

    return None
