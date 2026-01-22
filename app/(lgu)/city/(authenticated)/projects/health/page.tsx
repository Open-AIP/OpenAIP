import HealthProjectsView from "@/feature/projects/health/health-projects-view";
import { MOCK_AIPS } from "@/mock/aips";

export default function CityHealthProjects() {
  // Extract all health projects from city AIPs
  const healthProjects = MOCK_AIPS
    .filter((aip) => aip.scope === "city")
    .flatMap((aip) => aip.healthProjects || []);

  return <HealthProjectsView projects={healthProjects} scope="city" />;
}
