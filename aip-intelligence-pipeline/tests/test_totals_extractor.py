from __future__ import annotations

from openaip_pipeline.services.extraction.totals_extractor import extract_totals_from_pages


def test_extract_total_investment_program_line() -> None:
    pages = [
        "\n".join(
            [
                "ANNUAL INVESTMENT PROGRAM FY 2025",
                "TOTAL INVESTMENT PROGRAM: 77,092,531.00",
            ]
        )
    ]

    totals = extract_totals_from_pages(
        pages_text=pages,
        fiscal_year=2025,
        barangay_name="Mamatid",
    )

    assert len(totals) == 1
    total = totals[0]
    assert total["source_label"] == "total_investment_program"
    assert total["value"] == 77092531.0
    assert total["page_no"] == 1
    assert "TOTAL INVESTMENT PROGRAM: 77,092,531.00" in total["evidence_text"]
