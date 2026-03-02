from __future__ import annotations

from functools import lru_cache
import re
from typing import Any

import numpy as np

from .prototypes import INTENT_PROTOTYPES, validate_prototypes
from .text_norm import is_effectively_empty, normalize_text
from .thresholds import DEFAULT_MIN_MARGIN, DEFAULT_MIN_TOP1
from .types import IntentResult, IntentType

DEFAULT_MODEL_NAME = "sentence-transformers/paraphrase-MiniLM-L3-v2"
_BUILTIN_DEFAULT_MIN_TOP1 = DEFAULT_MIN_TOP1
_BUILTIN_DEFAULT_MIN_MARGIN = DEFAULT_MIN_MARGIN
_KEYWORD_PATTERN = re.compile(r"[a-z0-9]+")
_KEYWORD_STOP_WORDS = frozenset(
    {
        "a",
        "an",
        "and",
        "are",
        "by",
        "for",
        "from",
        "how",
        "i",
        "in",
        "is",
        "it",
        "me",
        "of",
        "our",
        "please",
        "show",
        "tell",
        "that",
        "the",
        "this",
        "to",
        "what",
        "which",
        "who",
    }
)
_MAX_KEYWORD_BONUS = 0.12

try:
    from sentence_transformers import SentenceTransformer
except Exception:  # pragma: no cover - exercised via init-time fallback in tests/runtime
    SentenceTransformer = None  # type: ignore[assignment]


class SemanticIntentClassifier:
    def __init__(
        self,
        model_name: str = DEFAULT_MODEL_NAME,
        min_top1: float = DEFAULT_MIN_TOP1,
        min_margin: float = DEFAULT_MIN_MARGIN,
    ) -> None:
        validate_prototypes()

        if SentenceTransformer is None:
            raise RuntimeError(
                "sentence-transformers is not available. Install the required dependencies before "
                "initializing SemanticIntentClassifier."
            )

        self._model_name = model_name
        self._min_top1 = self._resolve_threshold(
            configured_value=min_top1,
            builtin_default=_BUILTIN_DEFAULT_MIN_TOP1,
            live_default=DEFAULT_MIN_TOP1,
            name="min_top1",
        )
        self._min_margin = self._resolve_threshold(
            configured_value=min_margin,
            builtin_default=_BUILTIN_DEFAULT_MIN_MARGIN,
            live_default=DEFAULT_MIN_MARGIN,
            name="min_margin",
        )
        try:
            self._model = SentenceTransformer(model_name)
            self._prototype_embeddings = self._build_prototype_embeddings()
            self._prototype_keywords = self._build_prototype_keywords()
        except Exception as exc:  # pragma: no cover - depends on local model/runtime failures
            raise RuntimeError(
                f"Failed to initialize semantic intent classifier with model '{model_name}': {exc}"
            ) from exc

    @staticmethod
    def _resolve_threshold(
        *,
        configured_value: float,
        builtin_default: float,
        live_default: float,
        name: str,
    ) -> float:
        value = live_default if configured_value == builtin_default else configured_value
        if not 0.0 <= value <= 1.0:
            raise ValueError(f"{name} must be between 0.0 and 1.0.")
        return float(value)

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
    def _keyword_tokens(text: str) -> frozenset[str]:
        return frozenset(
            token
            for token in _KEYWORD_PATTERN.findall(text)
            if token and token not in _KEYWORD_STOP_WORDS and not token.isdigit()
        )

    def _build_prototype_keywords(self) -> dict[IntentType, list[frozenset[str]]]:
        grouped: dict[IntentType, list[frozenset[str]]] = {}
        for intent, phrases in INTENT_PROTOTYPES.items():
            if intent is IntentType.UNKNOWN:
                continue
            grouped[intent] = [self._keyword_tokens(normalize_text(phrase)) for phrase in phrases]
        return grouped

    @staticmethod
    def _keyword_overlap_score(
        query_keywords: frozenset[str],
        prototype_keywords: list[frozenset[str]],
    ) -> float:
        if not query_keywords:
            return 0.0

        best = 0.0
        for tokens in prototype_keywords:
            if not tokens:
                continue
            overlap = len(query_keywords & tokens) / len(tokens)
            if overlap > best:
                best = overlap
        return best

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
        query_keywords = self._keyword_tokens(normalized_text)
        scores: list[tuple[IntentType, float]] = []

        for intent, prototype_matrix in self._prototype_embeddings.items():
            if prototype_matrix.size == 0:
                semantic_score = 0.0
            else:
                similarities = prototype_matrix @ query_vector
                semantic_score = float(np.max(similarities))
            keyword_score = self._keyword_overlap_score(
                query_keywords, self._prototype_keywords.get(intent, [])
            )
            score = min(1.0, semantic_score + (keyword_score * _MAX_KEYWORD_BONUS))
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
        if top1_score < self._min_top1 or margin < self._min_margin:
            resolved_intent = IntentType.UNKNOWN

        return IntentResult(
            intent=resolved_intent,
            confidence=top1_score,
            top2_intent=top2_intent,
            top2_confidence=top2_score,
            margin=margin,
            method="semantic",
        )
