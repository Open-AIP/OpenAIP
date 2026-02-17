import { AipDetailsTableCard } from "@/components/aip/aip-details-table-card";
import type { AipProjectRow } from "@/lib/repos/aip/types";
import type { AipDetails } from "@/features/citizen/aips/types";

export default function AipProjectsTable({ aip }: { aip: AipDetails }) {
  const rows: AipProjectRow[] = (aip.projectRows ?? []).map((row) => ({
    id: row.id,
    aipId: aip.id,
    projectRefCode: row.aipReferenceCode,
    kind: "infrastructure",
    sector: row.sector,
    amount: Number(row.totalAmount?.replace?.(/[^0-9.]/g, "")) || 0,
    reviewStatus: "unreviewed",
    aipDescription: row.programDescription,
  }));

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
