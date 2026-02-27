import {
  applyAipUploaderMetadata,
  resolveDefaultFiscalYear,
  resolveSelectedFiscalYear,
} from "@/lib/repos/dashboard/mappers";
import type { DashboardAip } from "@/lib/repos/dashboard/types";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function makeAip(input: {
  id: string;
  fiscalYear: number;
  createdAt?: string;
}): DashboardAip {
  return {
    id: input.id,
    fiscalYear: input.fiscalYear,
    status: "draft",
    statusUpdatedAt: input.createdAt ?? "2026-02-27T10:00:00.000Z",
    submittedAt: null,
    publishedAt: null,
    createdAt: input.createdAt ?? "2026-02-27T10:00:00.000Z",
    uploadedBy: null,
    uploadedDate: null,
  };
}

export async function runDashboardMapperTests() {
  const aips = [makeAip({ id: "aip-2026", fiscalYear: 2026 }), makeAip({ id: "aip-2025", fiscalYear: 2025 })];

  const fallback = resolveDefaultFiscalYear(aips);
  assert(fallback === 2026, "Expected default fiscal year to use latest AIP year.");

  const selectedRequested = resolveSelectedFiscalYear({
    requestedFiscalYear: 2025,
    availableFiscalYears: [2026, 2025],
    fallbackFiscalYear: fallback,
  });
  assert(selectedRequested === 2025, "Expected requested fiscal year to be selected when available.");

  const selectedFallback = resolveSelectedFiscalYear({
    requestedFiscalYear: 2024,
    availableFiscalYears: [2026, 2025],
    fallbackFiscalYear: fallback,
  });
  assert(selectedFallback === 2026, "Expected selected fiscal year to fall back to latest available year.");

  const enriched = applyAipUploaderMetadata(
    aips,
    new Map([
      [
        "aip-2026",
        {
          uploadedBy: "Barangay Official",
          uploadedDate: "2026-02-27T08:00:00.000Z",
        },
      ],
    ])
  );

  assert(enriched[0].uploadedBy === "Barangay Official", "Expected uploader metadata to be merged into AIP rows.");
  assert(
    enriched[0].uploadedDate === "2026-02-27T08:00:00.000Z",
    "Expected upload date metadata to be merged into AIP rows."
  );
  assert(enriched[1].uploadedBy === null, "Expected rows without metadata to remain unchanged.");
}
