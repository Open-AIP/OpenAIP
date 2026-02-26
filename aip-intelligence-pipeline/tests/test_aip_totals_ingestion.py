from __future__ import annotations

from typing import Any

from openaip_pipeline.adapters.supabase.repositories import PipelineRepository


class _FakeClient:
    def __init__(self) -> None:
        self.insert_calls: list[dict[str, Any]] = []

    def select(
        self,
        table: str,
        *,
        select: str,
        filters: dict[str, str] | None = None,
        order: str | None = None,
        limit: int | None = None,
    ) -> list[dict[str, Any]]:
        del select, filters, order, limit
        if table != "aips":
            return []
        return [
            {
                "id": "aip-123",
                "fiscal_year": 2025,
                "barangay_id": "brgy-001",
                "city_id": None,
                "municipality_id": None,
            }
        ]

    def insert(
        self,
        table: str,
        row: dict[str, Any],
        *,
        select: str | None = None,
        on_conflict: str | None = None,
        upsert: bool = False,
    ) -> list[dict[str, Any]]:
        self.insert_calls.append(
            {
                "table": table,
                "row": row,
                "select": select,
                "on_conflict": on_conflict,
                "upsert": upsert,
            }
        )
        return [{"id": "ok"}]


def test_upsert_aip_totals_uses_source_of_truth_context_and_conflict_key() -> None:
    fake_client = _FakeClient()
    repo = PipelineRepository(fake_client)  # type: ignore[arg-type]

    repo.upsert_aip_totals(
        aip_id="aip-123",
        totals=[
            {
                "source_label": "total_investment_program",
                "fiscal_year": 2030,
                "value": 77092531.0,
                "currency": "PHP",
                "page_no": 1,
                "evidence_text": "TOTAL INVESTMENT PROGRAM: 77,092,531.00",
            }
        ],
    )

    assert len(fake_client.insert_calls) == 1
    call = fake_client.insert_calls[0]
    assert call["table"] == "aip_totals"
    assert call["on_conflict"] == "aip_id,source_label"
    assert call["upsert"] is True
    assert call["row"]["aip_id"] == "aip-123"
    assert call["row"]["source_label"] == "total_investment_program"
    assert call["row"]["fiscal_year"] == 2025
    assert call["row"]["barangay_id"] == "brgy-001"
    assert call["row"]["total_investment_program"] == 77092531.0
