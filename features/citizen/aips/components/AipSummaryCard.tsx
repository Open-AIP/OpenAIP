import { AipDetailsSummary } from "@/features/aip/components/aip-details-summary";
import type { AipHeader } from "@/lib/repos/aip/types";
import type { AipDetails } from "@/features/citizen/aips/types";

const parseCurrency = (value: string) => {
  const cleaned = value.replace(/[^0-9.]/g, "");
  const parsed = Number(cleaned);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const inferScope = (lguName: string): "city" | "barangay" =>
  lguName.toLowerCase().includes("city") ? "city" : "barangay";

const buildFallbackHeader = (aip: AipDetails): AipHeader => {
  const budget = parseCurrency(aip.budget);
  const scope = inferScope(aip.lguName);

  return {
    id: aip.id,
    scope,
    barangayName: scope === "barangay" ? aip.lguName : undefined,
    title: aip.title,
    description: aip.description,
    year: Number(aip.year),
    budget,
    uploadedAt: aip.publishedDate,
    publishedAt: aip.publishedDate,
    status: "published",
    fileName: aip.pdfFilename,
    pdfUrl: "",
    tablePreviewUrl: "",
    summaryText: aip.summary,
    detailedBullets: aip.detailedBullets,
    sectors: [],
    uploader: {
      name: aip.lguName,
      role: "Official",
      uploadDate: aip.publishedDate,
      budgetAllocated: budget,
    },
    feedback: undefined,
  };
};

export default function AipSummaryCard({ aip }: { aip: AipDetails }) {
  const resolved: AipHeader = buildFallbackHeader(aip);

  const communityLabel = resolved.scope === "city" ? "city" : "barangay";

  return (
    <AipDetailsSummary aip={resolved} communityLabel={communityLabel} />
  );
}
