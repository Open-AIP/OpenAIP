from __future__ import annotations

from openaip_pipeline.services.intent.router import IntentRouter
from openaip_pipeline.services.intent.types import IntentResult, IntentType


class FakeSemantic:
    def __init__(self) -> None:
        self.called = False
        self.calls: list[str] = []

    def classify(self, text: str) -> IntentResult:
        self.called = True
        self.calls.append(text)
        return IntentResult(
            intent=IntentType.GREETING,
            confidence=0.99,
            top2_intent=None,
            top2_confidence=None,
            margin=0.99,
            method="semantic",
        )


def test_rule_overrides_semantic_for_line_item_refs() -> None:
    fake = FakeSemantic()
    router = IntentRouter(semantic=fake)  # type: ignore[arg-type]

    result = router.route("REF-2025-001 details")

    assert result.intent is IntentType.LINE_ITEM_LOOKUP
    assert result.method == "rule"
    assert result.confidence == 1.0
    assert fake.called is False


def test_rule_overrides_semantic_for_totals() -> None:
    fake = FakeSemantic()
    router = IntentRouter(semantic=fake)  # type: ignore[arg-type]

    result = router.route("What is the total AIP budget for 2025?")

    assert result.intent is IntentType.TOTAL_AGGREGATION
    assert result.method == "rule"
    assert fake.called is False


def test_rules_do_not_match_uses_semantic() -> None:
    fake = FakeSemantic()
    router = IntentRouter(semantic=fake)  # type: ignore[arg-type]

    result = router.route("hello")

    assert result.intent is IntentType.GREETING
    assert result.method == "semantic"
    assert fake.called is True
    assert fake.calls == ["hello"]


def test_empty_string_returns_unknown_without_semantic() -> None:
    fake = FakeSemantic()
    router = IntentRouter(semantic=fake)  # type: ignore[arg-type]

    result = router.route("")

    assert result.intent is IntentType.UNKNOWN
    assert result.method == "none"
    assert result.confidence == 0.0
    assert fake.called is False


def test_prefer_does_not_false_positive_as_ref() -> None:
    fake = FakeSemantic()
    router = IntentRouter(semantic=fake)  # type: ignore[arg-type]

    result = router.route("I prefer this approach")

    assert result.intent is IntentType.GREETING
    assert result.method == "semantic"
    assert fake.called is True


def test_scope_clarification_rule_fires() -> None:
    fake = FakeSemantic()
    router = IntentRouter(semantic=fake)  # type: ignore[arg-type]

    result = router.route("Which barangay is this for?")

    assert result.intent is IntentType.SCOPE_NEEDS_CLARIFICATION
    assert result.method == "rule"
    assert fake.called is False


def test_bare_poblacion_is_treated_as_ambiguous_scope() -> None:
    fake = FakeSemantic()
    router = IntentRouter(semantic=fake)  # type: ignore[arg-type]

    result = router.route("Show budget for poblacion")

    assert result.intent is IntentType.SCOPE_NEEDS_CLARIFICATION
    assert result.method == "rule"
    assert fake.called is False


def test_qualified_poblacion_uses_semantic_path() -> None:
    fake = FakeSemantic()
    router = IntentRouter(semantic=fake)  # type: ignore[arg-type]

    result = router.route("Show budget for barangay poblacion")

    assert result.intent is IntentType.GREETING
    assert result.method == "semantic"
    assert fake.called is True
