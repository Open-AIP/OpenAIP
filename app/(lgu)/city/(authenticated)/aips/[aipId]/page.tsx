import { notFound } from "next/navigation";
import { AipDetailView } from "@/features/aip";
import { getAipRepo } from "@/lib/repos/aip/selector";

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
