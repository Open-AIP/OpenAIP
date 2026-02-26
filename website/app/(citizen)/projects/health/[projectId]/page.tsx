import { notFound } from "next/navigation";
import { HealthProjectDetailPageView } from "@/features/projects";
import { projectService } from "@/lib/repos/projects/queries";

export default async function CitizenHealthProject({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await projectService.getHealthProjectById(projectId, {
    publishedOnly: true,
  });

  if (!project) return notFound();

  return (
    <HealthProjectDetailPageView
      aipYear={project.year}
      project={project}
      scope="citizen"
    />
  );
}
