import { notFound } from "next/navigation";
import { AipDetailView } from "@/features/aip";
import { getAipRepo } from "@/lib/repos/aip/repo.server";

export default async function BarangayAipDetail({
  params,
}: {
  params: Promise<{ aipId: string }>;
}) {
  const { aipId } = await params;

  const aipRepo = getAipRepo({ defaultScope: "barangay" });
  const aip = await aipRepo.getAipDetail(aipId);

  if (!aip || aip.scope !== "barangay") return notFound();

  return <AipDetailView aip={aip} scope="barangay" />;
}
