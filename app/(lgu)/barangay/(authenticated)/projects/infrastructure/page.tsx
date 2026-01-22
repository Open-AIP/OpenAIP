import InfrastructureProjectsView from "@/feature/projects/infrastructure/infrastructure-projects-view";
import { MOCK_AIPS } from "@/mock/aips";

export default function BarangayInfrastructureProjects() {
  // Extract all infrastructure projects from barangay AIPs
  const infrastructureProjects = MOCK_AIPS
    .filter((aip) => aip.scope === "barangay")
    .flatMap((aip) => aip.infrastructureProjects || []);

  return <InfrastructureProjectsView projects={infrastructureProjects} scope="barangay" />;
}
