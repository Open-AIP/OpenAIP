from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class IntentType(str, Enum):
    GREETING = "GREETING"
    THANKS = "THANKS"
    COMPLAINT = "COMPLAINT"
    CLARIFY = "CLARIFY"
    TOTAL_AGGREGATION = "TOTAL_AGGREGATION"
    CATEGORY_AGGREGATION = "CATEGORY_AGGREGATION"
    LINE_ITEM_LOOKUP = "LINE_ITEM_LOOKUP"
    PROJECT_DETAIL = "PROJECT_DETAIL"
    DOCUMENT_EXPLANATION = "DOCUMENT_EXPLANATION"
    OUT_OF_SCOPE = "OUT_OF_SCOPE"
    SCOPE_NEEDS_CLARIFICATION = "SCOPE_NEEDS_CLARIFICATION"
    UNKNOWN = "UNKNOWN"


@dataclass(slots=True)
class IntentResult:
    intent: IntentType
    confidence: float
    top2_intent: IntentType | None
    top2_confidence: float | None
    margin: float
    method: str

    def to_dict(self) -> dict[str, str | float | None]:
        return {
            "intent": self.intent.value,
            "confidence": self.confidence,
            "top2_intent": self.top2_intent.value if self.top2_intent is not None else None,
            "top2_confidence": self.top2_confidence,
            "margin": self.margin,
            "method": self.method,
        }
