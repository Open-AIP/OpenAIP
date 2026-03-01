from __future__ import annotations

from .rules import (
    match_line_item_ref,
    match_scope_needs_clarification,
    match_total_aggregation,
)
from .semantic_classifier import SemanticIntentClassifier
from .text_norm import is_effectively_empty, normalize_text
from .types import IntentResult, IntentType


class IntentRouter:
    def __init__(self, semantic: SemanticIntentClassifier | None = None) -> None:
        self._semantic = semantic

    @staticmethod
    def _rule_result(intent: IntentType) -> IntentResult:
        return IntentResult(
            intent=intent,
            confidence=1.0,
            top2_intent=None,
            top2_confidence=None,
            margin=1.0,
            method="rule",
        )

    def _get_semantic(self) -> SemanticIntentClassifier:
        if self._semantic is None:
            self._semantic = SemanticIntentClassifier()
        return self._semantic

    def route(self, text: str) -> IntentResult:
        normalized = normalize_text(text)
        if is_effectively_empty(normalized):
            return IntentResult(
                intent=IntentType.UNKNOWN,
                confidence=0.0,
                top2_intent=None,
                top2_confidence=None,
                margin=0.0,
                method="none",
            )

        if match_line_item_ref(normalized):
            return self._rule_result(IntentType.LINE_ITEM_LOOKUP)

        if match_total_aggregation(normalized):
            return self._rule_result(IntentType.TOTAL_AGGREGATION)

        if match_scope_needs_clarification(normalized):
            return self._rule_result(IntentType.SCOPE_NEEDS_CLARIFICATION)

        return self._get_semantic().classify(text)
