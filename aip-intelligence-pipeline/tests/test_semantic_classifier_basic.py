from __future__ import annotations

import math

import numpy as np

from openaip_pipeline.services.intent.prototypes import INTENT_PROTOTYPES
from openaip_pipeline.services.intent.types import IntentType
import openaip_pipeline.services.intent.semantic_classifier as semantic_classifier


def _unit(vector: list[float]) -> np.ndarray:
    array = np.asarray(vector, dtype=np.float64)
    norm = np.linalg.norm(array)
    if norm == 0.0:
        return array
    return array / norm


class FakeSentenceTransformer:
    def __init__(self, model_name: str) -> None:
        self.model_name = model_name
        self._intent_vectors = {
            IntentType.GREETING: _unit([1.0, 0.0, 0.0]),
            IntentType.THANKS: _unit([0.995, 0.1, 0.0]),
            IntentType.COMPLAINT: _unit([0.0, 1.0, 0.0]),
            IntentType.CLARIFY: _unit([0.0, 0.0, 1.0]),
            IntentType.TOTAL_AGGREGATION: _unit([-1.0, 0.0, 0.0]),
            IntentType.CATEGORY_AGGREGATION: _unit([0.0, -1.0, 0.0]),
            IntentType.LINE_ITEM_LOOKUP: _unit([0.0, 0.0, -1.0]),
            IntentType.PROJECT_DETAIL: _unit([-0.7, 0.7, 0.0]),
            IntentType.DOCUMENT_EXPLANATION: _unit([0.7, 0.0, 0.7]),
            IntentType.OUT_OF_SCOPE: _unit([0.0, 0.7, 0.7]),
            IntentType.SCOPE_NEEDS_CLARIFICATION: _unit([0.0, -0.7, 0.7]),
        }
        self._prototype_lookup = {
            phrase.lower(): self._intent_vectors[intent]
            for intent, phrases in INTENT_PROTOTYPES.items()
            for phrase in phrases
        }
        self._input_lookup = {
            "semantic pass": self._intent_vectors[IntentType.TOTAL_AGGREGATION],
            "low confidence": _unit([math.cos(math.radians(33.0)), math.sin(math.radians(33.0)), 0.0]),
            "low margin": _unit([1.0, 0.05, 0.0]),
            "hello": self._intent_vectors[IntentType.GREETING],
        }

    def encode(self, texts: str | list[str]) -> np.ndarray:
        items = [texts] if isinstance(texts, str) else list(texts)
        rows = []
        for item in items:
            key = str(item).lower()
            vector = self._input_lookup.get(key, self._prototype_lookup.get(key))
            if vector is None:
                vector = _unit([0.2, 0.2, 0.2])
            rows.append(vector)
        return np.vstack(rows)


def test_empty_text_returns_unknown_with_none_method(monkeypatch) -> None:
    monkeypatch.setattr(semantic_classifier, "SentenceTransformer", FakeSentenceTransformer)
    classifier = semantic_classifier.SemanticIntentClassifier()

    result = classifier.classify("   ")

    assert result.intent is IntentType.UNKNOWN
    assert result.confidence == 0.0
    assert result.method == "none"
    assert result.top2_intent is None
    assert result.top2_confidence is None


def test_non_empty_text_returns_semantic_intent_result(monkeypatch) -> None:
    monkeypatch.setattr(semantic_classifier, "SentenceTransformer", FakeSentenceTransformer)
    classifier = semantic_classifier.SemanticIntentClassifier()

    result = classifier.classify("hello")

    assert isinstance(result.intent, IntentType)
    assert isinstance(result.confidence, float)
    assert result.method == "semantic"


def test_gating_returns_unknown_when_top1_below_threshold(monkeypatch) -> None:
    monkeypatch.setattr(semantic_classifier, "SentenceTransformer", FakeSentenceTransformer)
    monkeypatch.setattr(semantic_classifier, "DEFAULT_MIN_TOP1", 0.95)
    monkeypatch.setattr(semantic_classifier, "DEFAULT_MIN_MARGIN", 0.01)
    classifier = semantic_classifier.SemanticIntentClassifier()

    result = classifier.classify("low confidence")

    assert result.intent is IntentType.UNKNOWN
    assert result.confidence < semantic_classifier.DEFAULT_MIN_TOP1
    assert result.method == "semantic"


def test_gating_returns_unknown_when_margin_below_threshold(monkeypatch) -> None:
    monkeypatch.setattr(semantic_classifier, "SentenceTransformer", FakeSentenceTransformer)
    monkeypatch.setattr(semantic_classifier, "DEFAULT_MIN_TOP1", 0.5)
    monkeypatch.setattr(semantic_classifier, "DEFAULT_MIN_MARGIN", 0.02)
    classifier = semantic_classifier.SemanticIntentClassifier()

    result = classifier.classify("low margin")

    assert result.intent is IntentType.UNKNOWN
    assert result.confidence >= semantic_classifier.DEFAULT_MIN_TOP1
    assert result.margin < semantic_classifier.DEFAULT_MIN_MARGIN
    assert result.top2_intent is not None


def test_gating_returns_top1_when_thresholds_pass(monkeypatch) -> None:
    monkeypatch.setattr(semantic_classifier, "SentenceTransformer", FakeSentenceTransformer)
    monkeypatch.setattr(semantic_classifier, "DEFAULT_MIN_TOP1", 0.58)
    monkeypatch.setattr(semantic_classifier, "DEFAULT_MIN_MARGIN", 0.06)
    classifier = semantic_classifier.SemanticIntentClassifier()

    result = classifier.classify("semantic pass")

    assert result.intent is IntentType.TOTAL_AGGREGATION
    assert result.confidence >= semantic_classifier.DEFAULT_MIN_TOP1
    assert result.margin >= semantic_classifier.DEFAULT_MIN_MARGIN
    assert result.method == "semantic"
