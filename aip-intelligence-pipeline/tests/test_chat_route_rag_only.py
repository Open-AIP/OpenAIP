from __future__ import annotations

from types import SimpleNamespace

from fastapi.testclient import TestClient

from openaip_pipeline.api.app import create_app
from openaip_pipeline.api.routes import chat as chat_route_module


def test_chat_answer_calls_rag_path_only(monkeypatch) -> None:
    calls: dict[str, object] = {}

    monkeypatch.setattr(chat_route_module, "_require_internal_token", lambda _request: None)
    monkeypatch.setattr(
        chat_route_module.Settings,
        "load",
        lambda **_kwargs: SimpleNamespace(
            supabase_url="https://example.test",
            supabase_service_key="service-key",
            openai_api_key="openai-key",
            embedding_model="text-embedding-3-large",
            pipeline_model="gpt-5.2",
        ),
    )

    def fake_answer_with_rag(**kwargs):  # noqa: ANN003
        calls.update(kwargs)
        return {
            "question": kwargs["question"],
            "answer": "Grounded answer",
            "refused": False,
            "citations": [{"source_id": "c1", "snippet": "evidence"}],
            "retrieval_meta": {"reason": "ok"},
            "context_count": 1,
        }

    monkeypatch.setattr(chat_route_module, "answer_with_rag", fake_answer_with_rag)

    client = TestClient(create_app())
    response = client.post(
        "/v1/chat/answer",
        json={
            "question": "What is the FY 2026 budget?",
            "retrieval_scope": {"mode": "global", "targets": []},
            "retrieval_mode": "qa",
            "retrieval_filters": {"publication_status": "published"},
        },
    )

    assert response.status_code == 200
    assert response.json()["answer"] == "Grounded answer"
    assert calls["question"] == "What is the FY 2026 budget?"
    assert calls["retrieval_scope"] == {"mode": "global", "targets": []}


def test_removed_chat_endpoints_return_not_found() -> None:
    client = TestClient(create_app())

    embed_response = client.post("/v1/chat/embed-query", json={"text": "hello"})
    intent_response = client.post("/intent/classify", json={"text": "hello"})

    assert embed_response.status_code == 404
    assert intent_response.status_code == 404
