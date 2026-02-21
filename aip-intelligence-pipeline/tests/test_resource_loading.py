from openaip_pipeline.core.resources import read_json, read_text, read_yaml


def test_resource_loading() -> None:
    manifest = read_yaml("manifests/pipeline_versions.yaml")
    assert "default" in manifest
    rules = read_json("rules/barangay.rules.json")
    assert rules["ruleset_id"] == "barangay"
    prompt = read_text("prompts/summarization/system.txt")
    assert "summary" in prompt.lower()

