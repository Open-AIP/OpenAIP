from __future__ import annotations

from openaip_pipeline.services.extraction.signatory_parser import (
    parse_signatories_from_positioned_words,
    select_signatory_pages,
)


def _line_words(
    text: str,
    *,
    x0: float,
    y0: float,
    page: int = 1,
    word_gap: float = 4.0,
    char_width: float = 5.0,
) -> list[dict[str, float | int | str]]:
    words: list[dict[str, float | int | str]] = []
    cursor = float(x0)
    for token in text.split():
        token_width = max(12.0, len(token) * char_width)
        words.append(
            {
                "text": token,
                "x0": cursor,
                "x1": cursor + token_width,
                "y0": float(y0),
                "y1": float(y0 + 10.0),
                "page": page,
            }
        )
        cursor += token_width + word_gap
    return words


def test_label_only_no_names_emits_parse_failed() -> None:
    words = [
        *_line_words("Prepared by:", x0=40, y0=60),
        *_line_words("Approved by:", x0=360, y0=60),
        *_line_words("Reviewed by:", x0=650, y0=60),
    ]
    signatories, warnings = parse_signatories_from_positioned_words(
        words,
        page_number=1,
        page_width=900,
        page_height=700,
    )
    assert signatories == []
    assert any(item.get("code") == "SIGNATORY_PARSE_FAILED" for item in warnings)


def test_top_chained_labels_with_far_below_three_column_names_extracts_expected_roles() -> None:
    words = [
        *_line_words("Prepared by:", x0=40, y0=50),
        *_line_words("Approved by:", x0=520, y0=50),
        *_line_words("Arlene F. Romana", x0=40, y0=540),
        *_line_words("Barangay Treasurer", x0=40, y0=558),
        *_line_words("Raven D. Diomampo", x0=250, y0=540),
        *_line_words("Barangay Secretary", x0=250, y0=558),
        *_line_words("Hon. ERNANI G. HIMPISAO", x0=520, y0=540),
        *_line_words("Punong Barangay", x0=520, y0=558),
    ]
    signatories, warnings = parse_signatories_from_positioned_words(
        words,
        page_number=1,
        page_width=900,
        page_height=1000,
    )
    prepared = [entry for entry in signatories if entry.get("role") == "prepared_by"]
    approved = [entry for entry in signatories if entry.get("role") == "approved_by"]
    assert len(prepared) == 2
    prepared_names = {entry["name_text"] for entry in prepared}
    assert "Arlene F. Romana" in prepared_names
    assert "Raven D. Diomampo" in prepared_names
    assert len(approved) == 1
    assert approved[0]["name_text"] == "Hon. ERNANI G. HIMPISAO"
    assert not any(item.get("code") == "SIGNATORY_PARSE_FAILED" for item in warnings)


def test_signature_gap_tolerance_large_vertical_distance() -> None:
    words = [
        *_line_words("Approved by:", x0=360, y0=50),
        *_line_words("Hon. Dennis Felipe C. Hain", x0=360, y0=600),
        *_line_words("Local Chief Executive", x0=360, y0=618),
    ]
    signatories, warnings = parse_signatories_from_positioned_words(
        words,
        page_number=1,
        page_width=900,
        page_height=1000,
    )
    assert not warnings
    assert len(signatories) == 1
    assert signatories[0]["role"] == "approved_by"
    assert signatories[0]["name_text"] == "Hon. Dennis Felipe C. Hain"


def test_multi_person_prepared_by_extracts_multiple_entries() -> None:
    words = [
        *_line_words("Prepared by:", x0=40, y0=40),
        *_line_words("Arlene F. Romana", x0=40, y0=220),
        *_line_words("Barangay Treasurer", x0=40, y0=236),
        *_line_words("Raven D. Diomampo", x0=40, y0=280),
        *_line_words("Barangay Secretary", x0=40, y0=296),
    ]
    signatories, _ = parse_signatories_from_positioned_words(
        words,
        page_number=1,
        page_width=900,
        page_height=700,
    )
    prepared = [entry for entry in signatories if entry.get("role") == "prepared_by"]
    assert len(prepared) == 2
    names = {entry["name_text"] for entry in prepared}
    assert "Arlene F. Romana" in names
    assert "Raven D. Diomampo" in names


def test_reviewed_block_below_is_extracted() -> None:
    words = [
        *_line_words("Prepared by:", x0=40, y0=50),
        *_line_words("Approved by:", x0=520, y0=50),
        *_line_words("Arlene F. Romana", x0=40, y0=280),
        *_line_words("Barangay Treasurer", x0=40, y0=298),
        *_line_words("Hon. ERNANI G. HIMPISAO", x0=520, y0=280),
        *_line_words("Punong Barangay", x0=520, y0=298),
        *_line_words("Reviewed by:", x0=40, y0=440),
        *_line_words("EnP. Deanna T. Ortiz, MMPA", x0=40, y0=520),
        *_line_words("CPDC", x0=40, y0=538),
    ]
    signatories, _ = parse_signatories_from_positioned_words(
        words,
        page_number=1,
        page_width=900,
        page_height=1000,
    )
    reviewed = [entry for entry in signatories if entry.get("role") == "reviewed_by"]
    assert len(reviewed) == 1
    assert reviewed[0]["name_text"] == "EnP. Deanna T. Ortiz, MMPA"
    assert reviewed[0]["position_text"] == "CPDC"


def test_noise_rejection_chained_labels_not_name() -> None:
    words = [*_line_words("Approved by: Reviewed by:", x0=360, y0=50)]
    signatories, warnings = parse_signatories_from_positioned_words(
        words,
        page_number=1,
        page_width=900,
        page_height=700,
    )
    assert signatories == []
    assert any(item.get("code") == "SIGNATORY_PARSE_FAILED" for item in warnings)


def test_source_ref_evidence_contains_role_and_name() -> None:
    words = [
        *_line_words("Prepared by:", x0=40, y0=50),
        *_line_words("Lucia C. Salazar", x0=40, y0=220),
        *_line_words("Barangay Treasurer", x0=40, y0=236),
    ]
    signatories, _ = parse_signatories_from_positioned_words(
        words,
        page_number=1,
        page_width=900,
        page_height=700,
    )
    assert signatories
    for signatory in signatories:
        refs = signatory.get("source_refs") if isinstance(signatory.get("source_refs"), list) else []
        assert refs
        first_ref = refs[0]
        assert first_ref.get("page") == 1
        assert first_ref.get("kind") == "text_block"
        evidence = str(first_ref.get("evidence_text") or "").lower()
        assert str(signatory.get("name_text") or "").lower() in evidence
        assert str(signatory.get("role") or "").split("_")[0] in evidence


def test_select_signatory_pages_first_last_and_keyword_pages() -> None:
    pages = [
        "Annual Investment Program",
        "Body page",
        "Reviewed by: EnP Deanna T. Ortiz",
        "Closing page",
    ]
    assert select_signatory_pages(pages) == [1, 3, 4]
