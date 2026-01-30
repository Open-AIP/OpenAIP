import HealthProjectsView from "@/features/projects/health/views/health-projects-view";
import { projectService } from "@/features/projects/services";

export default async function CityHealthProjects() {
  const healthProjects = await projectService.getHealthProjects();

  return <HealthProjectsView projects={healthProjects} scope="city" />;
}
