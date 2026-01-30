import InfrastructureProjectsView from "@/features/projects/infrastructure/views/infrastructure-projects-view";
import { projectService } from "@/features/projects/services";

export default async function CityInfrastructureProjects() {
  const infrastructureProjects = await projectService.getInfrastructureProjects();

  return <InfrastructureProjectsView projects={infrastructureProjects} scope="city" />;
}
