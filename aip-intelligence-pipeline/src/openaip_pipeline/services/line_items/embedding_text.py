from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal, InvalidOperation
from typing import Any


def _normalize_date(value: Any) -> str:
    if value is None:
        return "N/A"
    if isinstance(value, date):
        return value.isoformat()

    text = str(value).strip()
    if not text:
        return "N/A"

    # Accept common extraction formats and normalize to ISO date.
    for fmt in (
        "%Y-%m-%d",
        "%Y/%m/%d",
        "%m/%d/%Y",
        "%m-%d-%Y",
        "%b %d, %Y",
        "%B %d, %Y",
        "%d %b %Y",
        "%d %B %Y",
    ):
        try:
            return datetime.strptime(text, fmt).date().isoformat()
        except ValueError:
            continue

    try:
        return datetime.fromisoformat(text).date().isoformat()
    except ValueError:
        return "N/A"


def _normalize_number(value: Any) -> str:
    if value is None:
        return "N/A"
    if isinstance(value, bool):
        return "N/A"
    if isinstance(value, (int, float, Decimal)):
        return str(value)

    text = str(value).strip()
    if not text:
        return "N/A"

    cleaned = text.replace(",", "").replace("PHP", "").replace("₱", "").strip()
    if not cleaned:
        return "N/A"
    try:
        return str(Decimal(cleaned))
    except (InvalidOperation, ValueError):
        return "N/A"


def _normalize_text(value: Any) -> str:
    if value is None:
        return "N/A"
    text = str(value).strip()
    return text if text else "N/A"


def build_line_item_embedding_text(line_item: dict[str, Any]) -> str:
    fiscal_year = _normalize_text(line_item.get("fiscal_year"))
    barangay = _normalize_text(line_item.get("barangay_name") or line_item.get("barangay_id"))
    aip_ref_code = _normalize_text(line_item.get("aip_ref_code"))

    sector_code = _normalize_text(line_item.get("sector_code"))
    sector_name = _normalize_text(line_item.get("sector_name"))
    title = _normalize_text(line_item.get("program_project_title"))

    fund = _normalize_text(line_item.get("fund_source"))
    start_date = _normalize_date(line_item.get("start_date"))
    end_date = _normalize_date(line_item.get("end_date"))

    ps = _normalize_number(line_item.get("ps"))
    mooe = _normalize_number(line_item.get("mooe"))
    fe = _normalize_number(line_item.get("fe"))
    co = _normalize_number(line_item.get("co"))
    total = _normalize_number(line_item.get("total"))

    implementing = _normalize_text(line_item.get("implementing_agency"))
    output = _normalize_text(line_item.get("expected_output"))

    page = _normalize_text(line_item.get("page_no"))
    row = _normalize_text(line_item.get("row_no"))
    table = _normalize_text(line_item.get("table_no"))

    return "\n".join(
        [
            "AIP_ROW",
            f"FY={fiscal_year}",
            f"Barangay={barangay}",
            f"Ref={aip_ref_code}",
            f"Sector={sector_code} {sector_name}",
            f"Title={title}",
            f"Fund={fund}",
            f"Schedule={start_date}..{end_date}",
            f"Amounts: PS={ps}; MOOE={mooe}; FE={fe}; CO={co}; Total={total}",
            f"Implementing={implementing}",
            f"Output={output}",
            f"Provenance: page={page} row={row} table={table}",
        ]
    )
