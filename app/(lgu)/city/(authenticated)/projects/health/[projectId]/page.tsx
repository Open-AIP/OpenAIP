import HealthProjectDetailPageView from "@/features/projects/health/views/health-project-detail-page-view";
import { projectService } from "@/features/projects/services";
import { notFound } from "next/navigation";

export default async function CityHealthProject({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  const project = await projectService.getHealthProjectById(projectId);
  
  if (!project) return notFound();

  return <HealthProjectDetailPageView aipYear={project.year} project={project} scope="city" />;
}
