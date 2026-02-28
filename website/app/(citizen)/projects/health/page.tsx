import { CitizenHealthProjectsView } from "@/features/citizen/projects";
import { projectService } from "@/lib/repos/projects/queries";

export default async function CitizenHealthProjectsPage() {
  const projects = await projectService.getHealthProjects({
    publishedOnly: true,
  });

  return <CitizenHealthProjectsView projects={projects} />;
}
