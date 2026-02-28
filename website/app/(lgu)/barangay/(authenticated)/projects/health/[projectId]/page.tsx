import { HealthProjectDetailPageView } from "@/features/projects";
import { getUser } from "@/lib/actions/auth.actions";
import { projectService } from "@/lib/repos/projects/queries";
import { notFound } from "next/navigation";

export default async function BarangayHealthProject({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { barangayId, scopeName } = await getUser();

  const project = await projectService.getHealthProjectById(projectId, {
    barangayId,
    barangayScopeName: scopeName,
    publishedOnly: true,
  });
  
  if (!project) return notFound();

  return <HealthProjectDetailPageView aipYear={project.year} project={project} scope="barangay" />;
}
