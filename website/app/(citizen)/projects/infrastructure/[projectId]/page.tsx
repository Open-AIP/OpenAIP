import { notFound } from "next/navigation";
import { InfrastructureProjectDetailPageView } from "@/features/projects";
import { projectService } from "@/lib/repos/projects/queries";

export default async function CitizenInfrastructureProject({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await projectService.getInfrastructureProjectById(projectId);

  if (!project) return notFound();

  return (
    <InfrastructureProjectDetailPageView
      aipYear={project.year}
      project={project}
      scope="citizen"
    />
  );
}