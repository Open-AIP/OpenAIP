import { notFound } from "next/navigation";
import { MOCK_AIPS } from "@/mock/aips";
import InfrastructureProjectDetailPageView from "@/feature/projects/infrastructure/infrastructure-project-detail-page-view";

export default async function InfrastructureProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  // Find the barangay AIP that contains this infrastructure project
  const aip = MOCK_AIPS.find(
    (a) => a.scope === "barangay" && (a.infrastructureProjects ?? []).some((p) => p.id === projectId)
  );

  if (!aip) return notFound();

  // Extract the project
  const project = (aip.infrastructureProjects ?? []).find((p) => p.id === projectId);

  if (!project) return notFound();

  return <InfrastructureProjectDetailPageView aipYear={aip.year} project={project} />;
}
