import { notFound } from "next/navigation";
import { AipProjectDetailView } from "@/features/aip";
import { getAipProjectRepo, getAipRepo } from "@/lib/repos/aip/repo.server";

export default async function BarangayAipProjectReviewPage({
  params,
}: {
  params: Promise<{ aipId: string; projectId: string }>;
}) {
  const { aipId, projectId } = await params;
  const aipRepo = getAipRepo({ defaultScope: "barangay" });
  const projectRepo = getAipProjectRepo("barangay");

  const [aip, detail] = await Promise.all([
    aipRepo.getAipDetail(aipId),
    projectRepo.getReviewDetail(aipId, projectId),
  ]);

  if (!aip || aip.scope !== "barangay" || !detail || detail.project.aipId !== aipId) {
    return notFound();
  }

  return <AipProjectDetailView scope="barangay" aip={aip} detail={detail} />;
}
