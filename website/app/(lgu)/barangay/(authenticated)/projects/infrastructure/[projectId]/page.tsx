import { notFound } from "next/navigation";
import { getUser } from "@/lib/actions/auth.actions";
import { projectService } from "@/lib/repos/projects/queries";
import { InfrastructureProjectDetailPageView } from "@/features/projects";

export default async function InfrastructureProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { barangayId, scopeName } = await getUser();

  const project = await projectService.getInfrastructureProjectById(projectId, {
    barangayId,
    barangayScopeName: scopeName,
    publishedOnly: true,
  });

  if (!project) return notFound();

  return <InfrastructureProjectDetailPageView aipYear={project.year} project={project} scope="barangay" />;
}
