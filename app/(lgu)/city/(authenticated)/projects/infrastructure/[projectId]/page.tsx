import { notFound } from "next/navigation";
import { projectService } from "@/features/projects/services";
import InfrastructureProjectDetailPageView from "@/features/projects/infrastructure/views/infrastructure-project-detail-page-view";

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
