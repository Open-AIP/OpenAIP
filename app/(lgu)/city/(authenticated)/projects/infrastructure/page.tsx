import InfrastructureProjectsView from "@/feature/projects/infrastructure/views/infrastructure-projects-view";
import { MOCK_AIPS } from "@/mock/aips";

export default function CityInfrastructureProjects() {
  // Extract all infrastructure projects from city AIPs
  const infrastructureProjects = MOCK_AIPS
    .filter((aip) => aip.scope === "city")
    .flatMap((aip) => aip.infrastructureProjects || []);

  return <InfrastructureProjectsView projects={infrastructureProjects} scope="city" />;
}
