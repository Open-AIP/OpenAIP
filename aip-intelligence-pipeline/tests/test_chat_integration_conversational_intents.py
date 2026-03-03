from __future__ import annotations

from types import SimpleNamespace

from fastapi.testclient import TestClient

from openaip_pipeline.api.app import create_app
import openaip_pipeline.api.routes.chat as chat_route_module
from openaip_pipeline.services.intent.chat_shortcuts import contains_domain_cues
from openaip_pipeline.services.intent.types import IntentResult, IntentType


class FakeRouter:
    def __init__(self, result: IntentResult) -> None:
        self.result = result
        self.calls: list[str] = []

    def route(self, text: str) -> IntentResult:
        self.calls.append(text)
        return self.result


def _fake_intent(intent: IntentType) -> IntentResult:
    return IntentResult(
        intent=intent,
        confidence=0.99,
        top2_intent=None,
        top2_confidence=None,
        margin=0.99,
        method="semantic",
    )


def _patch_chat_deps(monkeypatch, *, router: FakeRouter):
    rag_calls: list[str] = []

    def fake_require_internal_token(_provided_token):
        return None

    def fake_answer_with_rag(**kwargs):
        rag_calls.append(str(kwargs.get("question") or ""))
        question = str(kwargs.get("question") or "")
        return {
            "question": question,
            "answer": "normal path",
            "refused": False,
            "citations": [],
            "retrieval_meta": {"reason": "ok"},
            "context_count": 1,
        }

    monkeypatch.setattr(chat_route_module, "_INTENT_ROUTER", router)
    monkeypatch.setattr(chat_route_module, "_require_internal_token", fake_require_internal_token)
    monkeypatch.setattr(
        chat_route_module.Settings,
        "load",
        lambda **_kwargs: SimpleNamespace(
            pipeline_model="gpt-5.2",
            embedding_model="text-embedding-3-large",
            supabase_url="https://example.test",
            supabase_service_key="service-key",
            openai_api_key="openai-key",
        ),
    )
    monkeypatch.setattr(chat_route_module, "answer_with_rag", fake_answer_with_rag)
    return rag_calls


def _post_chat(client: TestClient, question: str):
    return client.post(
        "/v1/chat/answer",
        json={
            "question": question,
            "retrieval_scope": {"mode": "global", "targets": []},
        },
    )


def test_feature_flag_off_preserves_original_behavior(monkeypatch) -> None:
    monkeypatch.setenv("INTENT_ROUTER_ENABLED", "false")
    fake_router = FakeRouter(_fake_intent(IntentType.GREETING))
    rag_calls = _patch_chat_deps(monkeypatch, router=fake_router)
    client = TestClient(create_app())

    response = _post_chat(client, "hello")

    assert response.status_code == 200
    payload = response.json()
    assert payload["answer"] == "normal path"
    assert payload["retrieval_meta"]["reason"] == "ok"
    assert "Hi! I can help with published AIP totals" not in payload["answer"]
    assert fake_router.calls == []
    assert rag_calls == ["hello"]


def test_feature_flag_on_greeting_uses_shortcut(monkeypatch) -> None:
    monkeypatch.setenv("INTENT_ROUTER_ENABLED", "true")
    fake_router = FakeRouter(_fake_intent(IntentType.GREETING))
    rag_calls = _patch_chat_deps(monkeypatch, router=fake_router)
    client = TestClient(create_app())

    response = _post_chat(client, "hello")

    assert response.status_code == 200
    payload = response.json()
    assert payload["answer"] == (
        "Hi! I can help with published AIP totals, line items, and project details. "
        "What barangay/city and year should I check?"
    )
    assert payload["refused"] is False
    assert payload["citations"] == []
    assert payload["context_count"] == 0
    assert payload["retrieval_meta"]["reason"] == "conversational_shortcut"
    assert fake_router.calls == ["hello"]
    assert rag_calls == []


def test_feature_flag_on_thanks_uses_shortcut(monkeypatch) -> None:
    monkeypatch.setenv("INTENT_ROUTER_ENABLED", "true")
    fake_router = FakeRouter(_fake_intent(IntentType.THANKS))
    rag_calls = _patch_chat_deps(monkeypatch, router=fake_router)
    client = TestClient(create_app())

    response = _post_chat(client, "thanks")

    assert response.status_code == 200
    assert response.json()["answer"] == (
        "You're welcome! If you want, tell me the barangay/city + year and what you "
        "want to check in the AIP."
    )
    assert fake_router.calls == ["thanks"]
    assert rag_calls == []


def test_feature_flag_on_mixed_greeting_domain_question_does_not_short_circuit(monkeypatch) -> None:
    monkeypatch.setenv("INTENT_ROUTER_ENABLED", "true")
    fake_router = FakeRouter(_fake_intent(IntentType.GREETING))
    rag_calls = _patch_chat_deps(monkeypatch, router=fake_router)
    client = TestClient(create_app())
    question = "hello, what is the total AIP budget for 2025?"

    response = _post_chat(client, question)

    assert response.status_code == 200
    payload = response.json()
    assert payload["answer"] == "normal path"
    assert payload["answer"] != (
        "Hi! I can help with published AIP totals, line items, and project details. "
        "What barangay/city and year should I check?"
    )
    assert fake_router.calls == [question]
    assert rag_calls == [question]


def test_feature_flag_on_complaint_uses_shortcut(monkeypatch) -> None:
    monkeypatch.setenv("INTENT_ROUTER_ENABLED", "true")
    fake_router = FakeRouter(_fake_intent(IntentType.COMPLAINT))
    rag_calls = _patch_chat_deps(monkeypatch, router=fake_router)
    client = TestClient(create_app())

    response = _post_chat(client, "that answer is wrong")

    assert response.status_code == 200
    assert response.json()["answer"] == (
        "Thanks for flagging that. Which part looks incorrect (barangay/city, year, or "
        "project/ref code) so I can re-check using the published AIP data?"
    )
    assert fake_router.calls == ["that answer is wrong"]
    assert rag_calls == []


def test_feature_flag_on_clarify_uses_shortcut(monkeypatch) -> None:
    monkeypatch.setenv("INTENT_ROUTER_ENABLED", "true")
    fake_router = FakeRouter(_fake_intent(IntentType.CLARIFY))
    rag_calls = _patch_chat_deps(monkeypatch, router=fake_router)
    client = TestClient(create_app())

    response = _post_chat(client, "can you clarify?")

    assert response.status_code == 200
    assert response.json()["answer"] == (
        "Sure, tell me the barangay/city, year, and (if available) the ref code or "
        "project name you mean."
    )
    assert fake_router.calls == ["can you clarify?"]
    assert rag_calls == []


def test_feature_flag_on_out_of_scope_uses_shortcut(monkeypatch) -> None:
    monkeypatch.setenv("INTENT_ROUTER_ENABLED", "true")
    fake_router = FakeRouter(_fake_intent(IntentType.OUT_OF_SCOPE))
    rag_calls = _patch_chat_deps(monkeypatch, router=fake_router)
    client = TestClient(create_app())

    response = _post_chat(client, "are you gay")

    assert response.status_code == 200
    assert response.json()["answer"] == (
        "I can help with published AIP questions only. Ask about barangay/city budgets, "
        "fund sources, totals, or project details."
    )
    assert fake_router.calls == ["are you gay"]
    assert rag_calls == []


def test_contains_domain_cues_catches_year_tokens() -> None:
    assert contains_domain_cues("show me 2025 budget") is True


def test_contains_domain_cues_does_not_overfire_on_plain_greetings() -> None:
    assert contains_domain_cues("hello there") is False
