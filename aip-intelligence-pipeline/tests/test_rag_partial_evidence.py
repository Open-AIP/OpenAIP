from __future__ import annotations

import sys
import types

from openaip_pipeline.services.rag.rag import answer_with_rag


class _FakeDoc:
    def __init__(self, *, source_id: str, similarity: float, content: str) -> None:
        self.page_content = content
        self.metadata = {
            "source_id": source_id,
            "chunk_id": f"{source_id}-chunk",
            "aip_id": "aip-1",
            "fiscal_year": 2026,
            "scope_type": "barangay",
            "scope_id": "brgy-1",
            "scope_name": "Mamatid",
            "similarity": similarity,
            "metadata": {"page_no": 2},
        }


def test_answer_with_rag_refuses_weak_evidence_even_when_partial_flags_enabled(monkeypatch) -> None:
    monkeypatch.setenv("RAG_PARTIAL_MODE_ENABLED", "true")
    monkeypatch.setenv("RAG_BORDERLINE_PARTIAL_ENABLED", "true")
    monkeypatch.setenv("RAG_EVIDENCE_GATE_ENABLED", "false")

    fake_supabase_client_module = types.SimpleNamespace(create_client=lambda *_args, **_kwargs: object())
    fake_langchain_openai_module = types.SimpleNamespace(ChatOpenAI=object)
    monkeypatch.setitem(sys.modules, "supabase.client", fake_supabase_client_module)
    monkeypatch.setitem(sys.modules, "langchain_openai", fake_langchain_openai_module)

    docs = [_FakeDoc(source_id="S1", similarity=0.22, content="Limited matching context.")]
    monkeypatch.setattr(
        "openaip_pipeline.services.rag.rag.run_hybrid_retrieval",
        lambda **_kwargs: {
            "hybrid_enabled": False,
            "keyword_enabled": False,
            "rrf_enabled": False,
            "dense_docs": docs,
            "keyword_docs": [],
            "fused_docs": docs,
            "strong_docs": [],
        },
    )

    result = answer_with_rag(
        supabase_url="https://example.test",
        supabase_service_key="service-key",
        openai_api_key="openai-key",
        embeddings_model="text-embedding-3-large",
        chat_model="gpt-5.2",
        question="Explain this budget item",
        retrieval_scope={"mode": "global", "targets": []},
        top_k=8,
        min_similarity=0.3,
    )

    assert result["refused"] is True
    assert result["retrieval_meta"]["reason"] == "below_min_similarity"
    assert result["retrieval_meta"]["response_mode_source"] == "pipeline_refusal"


def test_answer_with_rag_uses_config_defaults_and_context_cap(monkeypatch) -> None:
    monkeypatch.setenv("RAG_MAX_CONTEXT_CHUNKS", "1")
    monkeypatch.setenv("RAG_TOP_K", "5")
    monkeypatch.setenv("RAG_MIN_SIMILARITY", "0.30")
    monkeypatch.setenv("RAG_GATE_MIN_FINAL_DOCS", "1")
    monkeypatch.setenv("RAG_LLM_MODEL", "gpt-4o-mini")
    monkeypatch.setenv("RAG_LLM_TEMPERATURE", "0")
    monkeypatch.setenv("RAG_LLM_MAX_TOKENS", "500")

    fake_supabase_client_module = types.SimpleNamespace(create_client=lambda *_args, **_kwargs: object())
    monkeypatch.setitem(sys.modules, "supabase.client", fake_supabase_client_module)

    seen_llm_kwargs: dict[str, object] = {}

    class _FakeChatOpenAI:
        def __init__(self, *args, **kwargs):  # noqa: D401, ANN001, ANN003
            seen_llm_kwargs.update(kwargs)
            self.calls = 0

        def invoke(self, _messages):  # noqa: ANN001
            self.calls += 1
            if self.calls == 1:
                return types.SimpleNamespace(content='{"answer":"Grounded answer [S1].","used_source_ids":["S1"]}')
            return types.SimpleNamespace(content='{"supported":true,"issues":[]}')

    monkeypatch.setitem(sys.modules, "langchain_openai", types.SimpleNamespace(ChatOpenAI=_FakeChatOpenAI))

    docs = [
        _FakeDoc(source_id="S1", similarity=0.91, content="Priority project details for the barangay."),
        _FakeDoc(source_id="S2", similarity=0.88, content="Second project context for the same priority plan."),
    ]
    monkeypatch.setattr(
        "openaip_pipeline.services.rag.rag.run_hybrid_retrieval",
        lambda **_kwargs: {
            "hybrid_enabled": False,
            "keyword_enabled": False,
            "rrf_enabled": False,
            "dense_docs": docs,
            "keyword_docs": [],
            "fused_docs": docs,
            "strong_docs": docs,
            "effective_top_k": 5,
            "retrieval_fetch_k": 20,
            "retrieval_mode": "qa",
            "retrieval_filters": {},
        },
    )

    result = answer_with_rag(
        supabase_url="https://example.test",
        supabase_service_key="service-key",
        openai_api_key="openai-key",
        embeddings_model="text-embedding-3-large",
        chat_model=None,
        question="What is the priority project?",
        retrieval_scope={"mode": "global", "targets": []},
    )

    assert result["refused"] is False
    assert result["context_count"] == 1
    assert seen_llm_kwargs["model"] == "gpt-4o-mini"
    assert seen_llm_kwargs["temperature"] == 0.0
    assert seen_llm_kwargs["max_tokens"] == 500


def test_answer_with_rag_request_values_override_config(monkeypatch) -> None:
    monkeypatch.setenv("RAG_TOP_K", "5")
    monkeypatch.setenv("RAG_MIN_SIMILARITY", "0.30")
    fake_supabase_client_module = types.SimpleNamespace(create_client=lambda *_args, **_kwargs: object())
    fake_langchain_openai_module = types.SimpleNamespace(ChatOpenAI=object)
    monkeypatch.setitem(sys.modules, "supabase.client", fake_supabase_client_module)
    monkeypatch.setitem(sys.modules, "langchain_openai", fake_langchain_openai_module)

    seen: dict[str, object] = {}

    def _fake_run_hybrid_retrieval(**kwargs):
        seen.update(kwargs)
        return {
            "hybrid_enabled": False,
            "keyword_enabled": False,
            "rrf_enabled": False,
            "dense_docs": [],
            "keyword_docs": [],
            "fused_docs": [],
            "strong_docs": [],
            "effective_top_k": kwargs.get("top_k"),
            "retrieval_fetch_k": kwargs.get("retrieval_fetch_k"),
            "retrieval_mode": kwargs.get("retrieval_mode"),
            "retrieval_filters": kwargs.get("retrieval_filters") or {},
        }

    monkeypatch.setattr("openaip_pipeline.services.rag.rag.run_hybrid_retrieval", _fake_run_hybrid_retrieval)

    result = answer_with_rag(
        supabase_url="https://example.test",
        supabase_service_key="service-key",
        openai_api_key="openai-key",
        embeddings_model="text-embedding-3-large",
        chat_model="gpt-4o-mini",
        question="Overview question",
        retrieval_scope={"mode": "global", "targets": []},
        retrieval_mode="overview",
        top_k=7,
        min_similarity=0.45,
    )

    assert seen["top_k"] == 7
    assert seen["min_similarity"] == 0.45
    assert result["refused"] is True
