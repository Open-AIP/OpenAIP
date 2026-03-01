from __future__ import annotations

from functools import lru_cache
from typing import Any

import numpy as np

from .prototypes import INTENT_PROTOTYPES, validate_prototypes
from .text_norm import is_effectively_empty, normalize_text
from .thresholds import DEFAULT_MIN_MARGIN, DEFAULT_MIN_TOP1
from .types import IntentResult, IntentType

DEFAULT_MODEL_NAME = "sentence-transformers/paraphrase-MiniLM-L3-v2"

try:
    from sentence_transformers import SentenceTransformer
except Exception:  # pragma: no cover - exercised via init-time fallback in tests/runtime
    SentenceTransformer = None  # type: ignore[assignment]


class SemanticIntentClassifier:
    def __init__(self, model_name: str = DEFAULT_MODEL_NAME) -> None:
        validate_prototypes()

        if SentenceTransformer is None:
            raise RuntimeError(
                "sentence-transformers is not available. Install the required dependencies before "
                "initializing SemanticIntentClassifier."
            )

        self._model_name = model_name
        try:
            self._model = SentenceTransformer(model_name)
            self._prototype_embeddings = self._build_prototype_embeddings()
        except Exception as exc:  # pragma: no cover - depends on local model/runtime failures
            raise RuntimeError(
                f"Failed to initialize semantic intent classifier with model '{model_name}': {exc}"
            ) from exc

    def _build_prototype_embeddings(self) -> dict[IntentType, np.ndarray]:
        grouped: dict[IntentType, np.ndarray] = {}
        for intent, phrases in INTENT_PROTOTYPES.items():
            if intent is IntentType.UNKNOWN:
                continue
            normalized_phrases = [normalize_text(phrase) for phrase in phrases]
            embeddings = self._coerce_embeddings(self._model.encode(normalized_phrases))
            grouped[intent] = self._normalize_rows(embeddings)
        return grouped

    @staticmethod
    def _coerce_embeddings(raw: Any) -> np.ndarray:
        matrix = np.asarray(raw, dtype=np.float64)
        if matrix.ndim == 1:
            matrix = matrix.reshape(1, -1)
        if matrix.ndim != 2:
            raise ValueError("Embedding output must be a 2D numeric array.")
        return matrix

    @staticmethod
    def _normalize_rows(matrix: np.ndarray) -> np.ndarray:
        if matrix.size == 0:
            return matrix

        norms = np.linalg.norm(matrix, axis=1, keepdims=True)
        safe_norms = np.where(norms == 0.0, 1.0, norms)
        return matrix / safe_norms

    @staticmethod
    def _normalize_vector(vector: np.ndarray) -> np.ndarray:
        norm = float(np.linalg.norm(vector))
        if norm == 0.0:
            return np.zeros_like(vector, dtype=np.float64)
        return vector / norm

    @lru_cache(maxsize=256)
    def _embed_normalized_text(self, normalized_text: str) -> np.ndarray:
        embedding = self._model.encode([normalized_text])
        return self._coerce_embeddings(embedding)[0]

    def _score_intents(self, normalized_text: str) -> list[tuple[IntentType, float]]:
        query_vector = self._normalize_vector(self._embed_normalized_text(normalized_text))
        scores: list[tuple[IntentType, float]] = []

        for intent, prototype_matrix in self._prototype_embeddings.items():
            if prototype_matrix.size == 0:
                score = 0.0
            else:
                similarities = prototype_matrix @ query_vector
                score = float(np.max(similarities))
            scores.append((intent, score))

        scores.sort(key=lambda item: (-item[1], item[0].value))
        return scores

    def classify(self, text: str) -> IntentResult:
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

        ranked = self._score_intents(normalized)
        top1_intent, top1_score = ranked[0]
        top2_intent: IntentType | None = None
        top2_score: float | None = None
        if len(ranked) > 1:
            top2_intent, top2_score = ranked[1]

        margin = top1_score - (top2_score if top2_score is not None else 0.0)
        resolved_intent = top1_intent
        if top1_score < DEFAULT_MIN_TOP1 or margin < DEFAULT_MIN_MARGIN:
            resolved_intent = IntentType.UNKNOWN

        return IntentResult(
            intent=resolved_intent,
            confidence=top1_score,
            top2_intent=top2_intent,
            top2_confidence=top2_score,
            margin=margin,
            method="semantic",
        )
