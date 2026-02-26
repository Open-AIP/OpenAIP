import { HealthProjectsView } from "@/features/projects";
import { projectService } from "@/lib/repos/projects/queries";

export default async function CityHealthProjects() {
  const healthProjects = await projectService.getHealthProjects({
    publishedOnly: true,
  });

  return <HealthProjectsView projects={healthProjects} scope="city" />;
}
