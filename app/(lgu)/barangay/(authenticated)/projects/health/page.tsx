import HealthProjectsView from "@/feature/projects/health/views/health-projects-view";
import { MOCK_AIPS } from "@/mock/aips";

export default function BarangayHealthProjects() {
  // Extract all health projects from barangay AIPs
  const healthProjects = MOCK_AIPS
    .filter((aip) => aip.scope === "barangay")
    .flatMap((aip) => aip.healthProjects || []);

  return <HealthProjectsView projects={healthProjects} scope="barangay" />;
}
