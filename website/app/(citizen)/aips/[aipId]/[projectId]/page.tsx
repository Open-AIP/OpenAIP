import { notFound } from "next/navigation";
import { getCitizenAipRepo } from "@/lib/repos/citizen-aips";
import {
  toAipDetails,
  toAipProjectDetails,
} from "@/features/citizen/aips/data/aips.data";
import CitizenAipProjectDetailView from "@/features/citizen/aips/views/citizen-aip-project-detail-view";

export const dynamic = "force-dynamic";

export default async function CitizenAipProjectPage({
  params,
}: {
  params: Promise<{ aipId: string; projectId: string }>;
}) {
  const { aipId, projectId } = await params;
  const repo = getCitizenAipRepo();

  const [aipRecord, projectRecord] = await Promise.all([
    repo.getPublishedAipDetail(aipId),
    repo.getPublishedAipProjectDetail({ aipId, projectId }),
  ]);

  if (!aipRecord || !projectRecord) {
    notFound();
  }

  return (
    <CitizenAipProjectDetailView
      aip={toAipDetails(aipRecord)}
      project={toAipProjectDetails(projectRecord)}
    />
  );
}
