import { InfrastructureProjectsView } from "@/features/projects";
import { projectService } from "@/lib/repos/projects/queries";

export default async function CityInfrastructureProjects() {
  const infrastructureProjects = await projectService.getInfrastructureProjects();

  return <InfrastructureProjectsView projects={infrastructureProjects} scope="city" />;
}
