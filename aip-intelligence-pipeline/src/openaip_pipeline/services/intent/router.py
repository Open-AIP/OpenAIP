from __future__ import annotations

from .rules import (
    match_category_aggregation,
    match_line_item_ref,
    match_scope_needs_clarification,
    match_total_aggregation,
)
from .semantic_classifier import SemanticIntentClassifier
from .text_norm import is_effectively_empty, normalize_text
from .types import IntentResult, IntentType


class IntentRouter:
    def __init__(
        self,
        semantic: SemanticIntentClassifier | None = None,
        *,
        semantic_enabled: bool = True,
        min_top1: float | None = None,
        min_margin: float | None = None,
    ) -> None:
        self._semantic = semantic
        self._semantic_enabled = semantic_enabled
        self._min_top1 = min_top1
        self._min_margin = min_margin

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
            kwargs: dict[str, float] = {}
            if self._min_top1 is not None:
                kwargs["min_top1"] = self._min_top1
            if self._min_margin is not None:
                kwargs["min_margin"] = self._min_margin
            self._semantic = SemanticIntentClassifier(**kwargs)
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

        if match_category_aggregation(normalized):
            return self._rule_result(IntentType.CATEGORY_AGGREGATION)

        if match_total_aggregation(normalized):
            return self._rule_result(IntentType.TOTAL_AGGREGATION)

        if match_scope_needs_clarification(normalized):
            return self._rule_result(IntentType.SCOPE_NEEDS_CLARIFICATION)

        if not self._semantic_enabled:
            return IntentResult(
                intent=IntentType.UNKNOWN,
                confidence=0.0,
                top2_intent=None,
                top2_confidence=None,
                margin=0.0,
                method="none",
            )

        return self._get_semantic().classify(text)
