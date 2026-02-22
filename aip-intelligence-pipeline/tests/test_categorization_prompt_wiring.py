from __future__ import annotations

from types import SimpleNamespace
from typing import Any

from openaip_pipeline.core.resources import read_text
from openaip_pipeline.services.categorization.categorize import (
    ProjectForCategorization,
    categorize_batch,
)


class _DummyResponse:
    def __init__(self) -> None:
        self.output_parsed = SimpleNamespace(items=[SimpleNamespace(index=0, category="Other")])
        self.usage = SimpleNamespace(input_tokens=1, output_tokens=1, total_tokens=2)


class _RecordingResponses:
    def __init__(self) -> None:
        self.last_kwargs: dict[str, Any] | None = None

    def parse(self, **kwargs: Any) -> _DummyResponse:
        self.last_kwargs = kwargs
        return _DummyResponse()


class _RecordingClient:
    def __init__(self) -> None:
        self.responses = _RecordingResponses()


def test_categorization_prompt_split_wiring() -> None:
    client = _RecordingClient()
    batch = [
        ProjectForCategorization(
            aip_ref_code="AIP-001",
            program_project_description="Drainage rehabilitation",
            implementing_agency="City Engineering Office",
            expected_output="Improved flood control",
            source_of_funds="General Fund",
        )
    ]

    categorize_batch(batch=batch, model="gpt-5.2", client=client)

    assert client.responses.last_kwargs is not None
    input_payload = client.responses.last_kwargs["input"]
    assert isinstance(input_payload, list) and len(input_payload) == 2

    expected_system_prompt = read_text("prompts/categorization/system.txt")
    assert input_payload[0]["role"] == "system"
    assert input_payload[0]["content"] == expected_system_prompt

    assert input_payload[1]["role"] == "user"
    user_text = str(input_payload[1]["content"])
    assert user_text.startswith("Items:\n\n")
    assert "ITEM 0" in user_text
    assert "Drainage rehabilitation" in user_text
    assert "---" not in user_text or "\n\n---\n\n" in user_text
    assert "Categories:" not in user_text
    assert "Rules:" not in user_text
