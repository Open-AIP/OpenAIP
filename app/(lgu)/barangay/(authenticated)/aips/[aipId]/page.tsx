import { notFound } from "next/navigation";
import { MOCK_AIPS } from "@/mock/aips";
import AipDetailView from "@/features/aip/views/aip-detail-view";

export default async function BarangayAipDetail({
  params,
}: {
  params: Promise<{ aipId: string }>;
}) {
  const { aipId } = await params;
  const aip = MOCK_AIPS.find((x) => x.id === aipId);
  if (!aip) return notFound();

  return <AipDetailView aip={aip} />;
}
