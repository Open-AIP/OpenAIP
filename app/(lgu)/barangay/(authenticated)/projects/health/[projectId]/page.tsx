import HealthProjectDetailPageView from "@/feature/projects/health/views/health-project-detail-page-view";
import { MOCK_AIPS } from "@/mock/aips";
import { notFound } from "next/navigation";

export default async function BarangayHealthProject({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  const aip = MOCK_AIPS.find(
    (a) => a.scope === "barangay" && (a.healthProjects ?? []).some((p) => p.id === projectId)
  );
  if (!aip) return notFound();

  const project = (aip.healthProjects ?? []).find((p) => p.id === projectId);
  if (!project) return notFound();

  return <HealthProjectDetailPageView aipYear={aip.year} project={project} scope="barangay" />;
}
