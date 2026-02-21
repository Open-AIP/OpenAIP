from openaip_pipeline.services.validation.rules_engine import list_rule_ids, load_rules


def test_rules_engine_barangay() -> None:
    payload = load_rules("barangay")
    assert payload["version"] == "v1.0.0"
    assert "R001" in list_rule_ids("barangay")

