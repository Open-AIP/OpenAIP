import { HealthProjectsView } from "@/features/projects";
import { projectService } from "@/lib/repos/projects/queries";

export default async function CityHealthProjects() {
  const healthProjects = await projectService.getHealthProjects();

  return <HealthProjectsView projects={healthProjects} scope="city" />;
}
