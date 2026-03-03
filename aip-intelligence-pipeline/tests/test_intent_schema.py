from __future__ import annotations

import json

from openaip_pipeline.services.intent.prototypes import INTENT_PROTOTYPES, validate_prototypes
from openaip_pipeline.services.intent.types import IntentResult, IntentType


def test_intent_type_members_exist() -> None:
    expected = {
        "GREETING",
        "THANKS",
        "COMPLAINT",
        "CLARIFY",
        "TOTAL_AGGREGATION",
        "CATEGORY_AGGREGATION",
        "LINE_ITEM_LOOKUP",
        "PROJECT_DETAIL",
        "DOCUMENT_EXPLANATION",
        "OUT_OF_SCOPE",
        "SCOPE_NEEDS_CLARIFICATION",
        "UNKNOWN",
    }

    assert {member.value for member in IntentType} == expected


def test_unknown_member_exists() -> None:
    assert IntentType.UNKNOWN.value == "UNKNOWN"


def test_all_non_unknown_intents_have_prototypes() -> None:
    expected = {intent for intent in IntentType if intent is not IntentType.UNKNOWN}

    assert set(INTENT_PROTOTYPES) == expected


def test_every_intent_has_at_least_five_prototype_strings() -> None:
    for intent, phrases in INTENT_PROTOTYPES.items():
        assert len(phrases) >= 5, intent.value
        assert all(isinstance(phrase, str) and phrase.strip() for phrase in phrases), intent.value


def test_validate_prototypes_does_not_raise() -> None:
    validate_prototypes()


def test_intent_result_to_dict_is_json_serializable() -> None:
    result = IntentResult(
        intent=IntentType.TOTAL_AGGREGATION,
        confidence=0.81,
        top2_intent=IntentType.CATEGORY_AGGREGATION,
        top2_confidence=0.7,
        margin=0.11,
        method="none",
    )

    payload = result.to_dict()

    assert payload == {
        "intent": "TOTAL_AGGREGATION",
        "confidence": 0.81,
        "top2_intent": "CATEGORY_AGGREGATION",
        "top2_confidence": 0.7,
        "margin": 0.11,
        "method": "none",
    }
    json.dumps(payload)
