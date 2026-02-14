'use client';

import { AipDetailsTableCard } from "@/features/aip/components/aip-details-table-card";
import type { AipProjectRow } from "@/lib/repos/aip/types";
import { AIP_PROJECT_ROWS_TABLE } from "@/mocks/fixtures/aip/aip-project-rows.table.fixture";
import type { AipDetails } from "@/features/citizen/aips/types";

export default function AipProjectsTable({ aip }: { aip: AipDetails }) {
  const matchingRows = AIP_PROJECT_ROWS_TABLE.filter((row) => row.aipId === aip.id);
  const rows: AipProjectRow[] = matchingRows.length
    ? matchingRows
    : AIP_PROJECT_ROWS_TABLE.slice(0, 6);

  return (
    <AipDetailsTableCard
      year={Number(aip.year)}
      rows={rows}
      onRowClick={() => {}}
      canComment
      focusedRowId={undefined}
    />
  );
}
