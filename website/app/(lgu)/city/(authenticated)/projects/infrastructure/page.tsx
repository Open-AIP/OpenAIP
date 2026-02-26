import { InfrastructureProjectsView } from "@/features/projects";
import { getUser } from "@/lib/actions/auth.actions";
import { projectService } from "@/lib/repos/projects/queries";

export default async function CityInfrastructureProjects() {
  const { cityId, scopeName } = await getUser();
  const infrastructureProjects = await projectService.getInfrastructureProjects({
    cityId,
    cityScopeName: scopeName,
    publishedOnly: true,
  });

  return <InfrastructureProjectsView projects={infrastructureProjects} scope="city" />;
}
