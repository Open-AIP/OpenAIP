import { CitizenInfrastructureProjectsView } from "@/features/citizen/projects";
import { projectService } from "@/lib/repos/projects/queries";

export default async function CitizenInfrastructureProjectsPage() {
  const projects = await projectService.getInfrastructureProjects({
    publishedOnly: true,
  });

  return <CitizenInfrastructureProjectsView projects={projects} />;
}
