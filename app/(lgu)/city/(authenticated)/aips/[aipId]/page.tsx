import { notFound } from "next/navigation";
import { MOCK_AIPS } from "@/mock/aips";
import AipDetailView from "@/feature/aips/views/aip-detail-view";

export default async function CityAipDetailPage({
  params,
}: {
  params: Promise<{ aipId: string }>;
}) {
  const { aipId } = await params;

  const aip = MOCK_AIPS.find((x) => x.id === aipId && x.scope === "city");
  
  console.log("=== City AIP Detail ===");
  console.log("AIP ID:", aipId);
  console.log("AIP Found:", aip);
  console.log("AIP Contents:", JSON.stringify(aip, null, 2));
  
  if (!aip) return notFound();

  return <AipDetailView aip={aip} scope="city" />;
}
