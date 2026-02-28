import { HealthProjectsView } from "@/features/projects";
import { getUser } from "@/lib/actions/auth.actions";
import { projectService } from "@/lib/repos/projects/queries";

export default async function CityHealthProjects() {
  const { cityId, scopeName } = await getUser();
  const healthProjects = await projectService.getHealthProjects({
    cityId,
    cityScopeName: scopeName,
    publishedOnly: true,
  });

  return <HealthProjectsView projects={healthProjects} scope="city" />;
}
