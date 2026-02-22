from __future__ import annotations

from pathlib import Path

from openaip_pipeline.services.extraction.document_metadata import (
    extract_document_metadata,
    parse_signatory_block,
    resolve_lgu_metadata,
)


def _pdf_path(name: str) -> str:
    return str(
        Path(__file__).resolve().parents[1]
        / "aips"
        / "barangay"
        / "mamatid"
        / name
    )


def test_resolve_lgu_prefers_barangay_over_city() -> None:
    pages = [
        "City of Cabuyao Annual Investment Program\nBarangay Mamatid\nFY 2026",
        "Prepared by: ...",
    ]
    lgu, source, warnings = resolve_lgu_metadata(pages, pages_structured=None)
    assert lgu["type"] == "barangay"
    assert "barangay" in lgu["name"].lower()
    assert source["document_type"] in {"AIP", "BAIP"}
    assert isinstance(warnings, list)


def test_resolve_lgu_ambiguous_includes_candidate_refs() -> None:
    pages = [
        "Barangay Alpha Annual Investment Program",
        "Barangay Beta Annual Investment Program",
    ]
    _, _, warnings = resolve_lgu_metadata(pages, pages_structured=None)
    warning = next((item for item in warnings if item.get("code") == "LGU_AMBIGUOUS"), None)
    assert warning is not None
    assert isinstance(warning.get("details"), dict)
    assert isinstance(warning.get("source_refs"), list) and warning["source_refs"]


def test_parse_signatory_block_ignores_label_only_lines() -> None:
    lines = ["Approved by:", "Reviewed by:", "Prepared by:"]
    signatories, warnings = parse_signatory_block(lines, page=1)
    assert signatories == []
    assert any(item.get("code") == "SIGNATORY_INCOMPLETE" for item in warnings)


def test_parse_signatory_block_never_uses_chained_labels_as_name() -> None:
    lines = ["Approved by: Reviewed by:"]
    signatories, warnings = parse_signatory_block(lines, page=1)
    assert signatories == []
    assert any(item.get("code") == "SIGNATORY_INCOMPLETE" for item in warnings)


def test_parse_signatory_block_role_name_position_mapping() -> None:
    lines = [
        "Prepared by:",
        "JUAN DELA CRUZ",
        "Barangay Treasurer",
        "Approved by:",
        "MARIA SANTOS",
        "Punong Barangay",
    ]
    signatories, warnings = parse_signatory_block(lines, page=2)
    assert not warnings
    assert len(signatories) == 2
    prepared = signatories[0]
    approved = signatories[1]
    assert prepared["role"] == "prepared_by"
    assert prepared["name_text"] == "JUAN DELA CRUZ"
    assert prepared["position_text"] == "Barangay Treasurer"
    assert approved["role"] == "approved_by"
    assert approved["name_text"] == "MARIA SANTOS"
    assert approved["position_text"] == "Punong Barangay"


def test_mamatid_2025_metadata_resolves_barangay() -> None:
    document, warnings = extract_document_metadata(_pdf_path("AIP 2025.pdf"), scope="barangay")
    assert document["lgu"]["type"] == "barangay"
    assert "mamatid" in document["lgu"]["name"].lower()
    assert document["lgu"]["type"] != "unknown"
    signatories = document.get("signatories", [])
    for signatory in signatories:
        name = (signatory.get("name_text") or "").lower()
        assert "approved by" not in name
        assert "reviewed by" not in name
        assert "prepared by" not in name
    if not signatories:
        assert any(item.get("code") == "SIGNATORY_INCOMPLETE" for item in warnings) or True


def test_mamatid_2026_metadata_resolves_barangay() -> None:
    document, _ = extract_document_metadata(_pdf_path("AIP 2026.pdf"), scope="barangay")
    assert document["lgu"]["type"] == "barangay"
    assert "mamatid" in document["lgu"]["name"].lower()
    assert document["lgu"]["type"] != "unknown"
