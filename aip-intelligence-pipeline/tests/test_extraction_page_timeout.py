from __future__ import annotations

import os
import tempfile
from types import SimpleNamespace
from typing import Any

import httpx
import pytest
from openai import APITimeoutError

from openaip_pipeline.services.extraction import barangay as barangay_module
from openaip_pipeline.services.extraction import city as city_module


@pytest.mark.parametrize("module", [city_module, barangay_module], ids=["city", "barangay"])
def test_resolve_extract_page_timeout_precedence(module, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("PIPELINE_EXTRACT_PAGE_TIMEOUT_SECONDS", raising=False)
    monkeypatch.delenv("PIPELINE_EXTRACT_TIMEOUT_SECONDS", raising=False)

    resolve = module._resolve_extract_page_timeout_seconds
    assert resolve(extract_page_timeout_seconds=None, extract_timeout_seconds=None) == 300.0

    monkeypatch.setenv("PIPELINE_EXTRACT_TIMEOUT_SECONDS", "1800")
    assert resolve(extract_page_timeout_seconds=None, extract_timeout_seconds=None) == 1800.0

    monkeypatch.setenv("PIPELINE_EXTRACT_PAGE_TIMEOUT_SECONDS", "301")
    assert resolve(extract_page_timeout_seconds=None, extract_timeout_seconds=None) == 301.0
    assert resolve(extract_page_timeout_seconds=None, extract_timeout_seconds=123.0) == 123.0
    assert resolve(extract_page_timeout_seconds=111.0, extract_timeout_seconds=222.0) == 111.0


class _TimeoutClient:
    def __init__(self) -> None:
        self.timeouts: list[float] = []
        self.files = self._Files()
        self.responses = self._Responses()

    def with_options(self, *, timeout: float) -> "_TimeoutClient":
        self.timeouts.append(timeout)
        return self

    class _Files:
        def create(self, *, file: Any, purpose: str) -> Any:
            return SimpleNamespace(id="file-timeout")

    class _Responses:
        def parse(self, **kwargs: Any) -> Any:
            raise APITimeoutError(request=httpx.Request("POST", "https://example.test/extract"))


@pytest.mark.parametrize("module", [city_module, barangay_module], ids=["city", "barangay"])
def test_page_timeout_raises_extract_timeout_and_cleans_temp_file(module, monkeypatch: pytest.MonkeyPatch) -> None:
    page_fn = (
        module.extract_city_aip_from_pdf_page
        if module is city_module
        else module.extract_brgy_aip_from_pdf_page
    )
    temp_pdf = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
    temp_pdf.write(b"%PDF-1.4 test")
    temp_pdf.flush()
    temp_pdf.close()
    page_pdf_path = temp_pdf.name
    assert os.path.exists(page_pdf_path)

    monkeypatch.setattr(module, "extract_single_page_pdf", lambda original_pdf_path, page_index: page_pdf_path)
    client = _TimeoutClient()
    with pytest.raises(module.ExtractionGuardrailError) as error:
        page_fn(
            client=client,
            pdf_path="ignored.pdf",
            page_index=0,
            total_pages=3,
            model="gpt-5.2",
            system_prompt="system",
            user_prompt="user",
            page_timeout_seconds=300.0,
        )

    assert error.value.reason_code == "EXTRACT_TIMEOUT"
    assert "page 1/3" in str(error.value)
    assert not os.path.exists(page_pdf_path)
    assert len(client.timeouts) >= 1


@pytest.mark.parametrize("module", [city_module, barangay_module], ids=["city", "barangay"])
def test_all_pages_uses_per_page_timeout_without_global_elapsed_limit(
    module,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    all_pages_fn = (
        module.extract_city_aip_from_pdf_all_pages
        if module is city_module
        else module.extract_brgy_aip_from_pdf_all_pages
    )
    page_fn_name = "extract_city_aip_from_pdf_page" if module is city_module else "extract_brgy_aip_from_pdf_page"
    empty_payload = (
        city_module.CityAIPExtraction(projects=[])
        if module is city_module
        else barangay_module.BrgyAIPExtraction(projects=[])
    )

    monkeypatch.setattr(
        module,
        "PdfReader",
        lambda pdf_path: SimpleNamespace(pages=[object(), object(), object()]),
    )
    monkeypatch.setattr(module, "read_text", lambda resource_path: "prompt")

    clock = {"value": 0.0}

    def fake_perf_counter() -> float:
        return clock["value"]

    monkeypatch.setattr(module.time, "perf_counter", fake_perf_counter)

    observed_page_timeouts: list[float] = []

    def fake_extract_page(*args: Any, **kwargs: Any) -> tuple[Any, dict[str, int]]:
        observed_page_timeouts.append(float(kwargs["page_timeout_seconds"]))
        clock["value"] += 0.04
        return empty_payload, {"input_tokens": 1, "output_tokens": 1, "total_tokens": 2}

    monkeypatch.setattr(module, page_fn_name, fake_extract_page)

    projects, usage, page_count = all_pages_fn(
        client=SimpleNamespace(),
        pdf_path="ignored.pdf",
        model="gpt-5.2",
        on_progress=None,
        parse_timeout_seconds=20.0,
        extract_timeout_seconds=0.05,
    )

    assert page_count == 3
    assert projects == []
    assert usage["input_tokens"] == 3
    assert usage["output_tokens"] == 3
    assert usage["total_tokens"] == 6
    assert usage["project_key_normalized_changes_count"] == 0
    assert observed_page_timeouts == [0.05, 0.05, 0.05]
    assert clock["value"] > 0.05
