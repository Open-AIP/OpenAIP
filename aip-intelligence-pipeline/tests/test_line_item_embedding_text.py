from __future__ import annotations

from openaip_pipeline.services.line_items.embedding_text import build_line_item_embedding_text


def test_build_line_item_embedding_text_includes_schedule_and_iso_dates() -> None:
    text = build_line_item_embedding_text(
        {
            "fiscal_year": 2026,
            "barangay_id": "brgy-001",
            "aip_ref_code": "1000-A",
            "sector_code": "1000",
            "sector_name": "Social Services",
            "program_project_title": "Honoraria - Administrative",
            "fund_source": "General Fund",
            "start_date": "01/15/2026",
            "end_date": "2026-12-31",
            "ps": 1000,
            "mooe": 500,
            "fe": 0,
            "co": 0,
            "total": 1500,
            "implementing_agency": "Barangay Council",
            "expected_output": "Monthly honoraria released",
            "page_no": 2,
            "row_no": 5,
            "table_no": 1,
        }
    )

    assert "Schedule=2026-01-15..2026-12-31" in text
    assert "Amounts: PS=1000; MOOE=500; FE=0; CO=0; Total=1500" in text
    assert "Provenance: page=2 row=5 table=1" in text


def test_build_line_item_embedding_text_uses_na_for_missing_numbers() -> None:
    text = build_line_item_embedding_text(
        {
            "fiscal_year": 2026,
            "barangay_id": "brgy-001",
            "program_project_title": "Road Concreting",
            "start_date": "invalid-date",
            "end_date": None,
            "ps": None,
            "mooe": "",
            "fe": None,
            "co": None,
            "total": None,
            "page_no": None,
            "row_no": None,
            "table_no": None,
        }
    )

    assert "Schedule=N/A..N/A" in text
    assert "Amounts: PS=N/A; MOOE=N/A; FE=N/A; CO=N/A; Total=N/A" in text
