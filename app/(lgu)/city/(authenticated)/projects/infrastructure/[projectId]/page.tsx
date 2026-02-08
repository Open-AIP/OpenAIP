import { notFound } from "next/navigation";
import { projectService } from "@/lib/repos/projects/queries";
import { InfrastructureProjectDetailPageView } from "@/features/projects";

export default async function CityInfrastructureProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  const project = await projectService.getInfrastructureProjectById(projectId);

  if (!project) return notFound();

  return <InfrastructureProjectDetailPageView aipYear={project.year} project={project} scope="city" />;
}
