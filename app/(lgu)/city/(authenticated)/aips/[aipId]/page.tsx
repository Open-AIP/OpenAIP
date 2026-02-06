import { notFound } from "next/navigation";
import AipDetailView from "@/features/aip/views/aip-detail-view";
import { getAipRepo } from "@/features/aip/services/aip-repo.selector";

export default async function CityAipDetailPage({
  params,
}: {
  params: Promise<{ aipId: string }>;
}) {
  const { aipId } = await params;

  const aipRepo = getAipRepo({ defaultScope: "city" });
  const aip = await aipRepo.getAipDetail(aipId);

  if (!aip || aip.scope !== "city") return notFound();

  return <AipDetailView aip={aip} scope="city" />;
}
