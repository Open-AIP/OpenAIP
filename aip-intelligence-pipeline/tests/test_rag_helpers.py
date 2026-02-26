from openaip_pipeline.services.rag.rag import _extract_json, _extract_source_ids


def test_extract_source_ids_dedupes_and_orders():
    answer = "Budget is concentrated on health [S2] and infra [S1]. Health remains highest [S2]."
    assert _extract_source_ids(answer) == ["S2", "S1"]


def test_extract_json_accepts_wrapped_payload():
    text = "Model output:\n```json\n{\"answer\":\"ok\",\"used_source_ids\":[\"S1\"]}\n```"
    parsed = _extract_json(text)
    assert parsed is not None
    assert parsed["answer"] == "ok"
