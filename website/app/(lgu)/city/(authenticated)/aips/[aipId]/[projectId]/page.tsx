import { notFound } from "next/navigation";
import { AipProjectDetailView } from "@/features/aip";
import { getAipProjectRepo, getAipRepo } from "@/lib/repos/aip/repo.server";

export default async function CityAipProjectReviewPage({
  params,
}: {
  params: Promise<{ aipId: string; projectId: string }>;
}) {
  const { aipId, projectId } = await params;
  const aipRepo = getAipRepo({ defaultScope: "city" });
  const projectRepo = getAipProjectRepo("city");

  const [aip, detail] = await Promise.all([
    aipRepo.getAipDetail(aipId),
    projectRepo.getReviewDetail(aipId, projectId),
  ]);

  if (!aip || aip.scope !== "city" || !detail || detail.project.aipId !== aipId) {
    return notFound();
  }

  return <AipProjectDetailView scope="city" aip={aip} detail={detail} />;
}
