import type { DashboardAip } from "./types";

export type DashboardAipUploadMeta = {
  uploadedBy: string | null;
  uploadedDate: string | null;
};

export function resolveDefaultFiscalYear(aips: DashboardAip[]): number {
  if (aips.length > 0) return aips[0].fiscalYear;
  return new Date().getFullYear();
}

export function resolveSelectedFiscalYear(input: {
  requestedFiscalYear?: number | null;
  availableFiscalYears: number[];
  fallbackFiscalYear: number;
}): number {
  if (
    typeof input.requestedFiscalYear === "number" &&
    Number.isFinite(input.requestedFiscalYear) &&
    input.availableFiscalYears.includes(input.requestedFiscalYear)
  ) {
    return input.requestedFiscalYear;
  }

  return input.fallbackFiscalYear;
}

export function applyAipUploaderMetadata(
  aips: DashboardAip[],
  metadataByAipId: Map<string, DashboardAipUploadMeta>
): DashboardAip[] {
  return aips.map((aip) => {
    const metadata = metadataByAipId.get(aip.id);
    if (!metadata) return aip;
    return {
      ...aip,
      uploadedBy: metadata.uploadedBy,
      uploadedDate: metadata.uploadedDate,
    };
  });
}
