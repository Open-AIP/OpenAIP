import { HealthProjectsView } from "@/features/projects";
import { projectService } from "@/lib/repos/projects/queries";

/**
 * DATA ISOLATION: Uses Projects service only (NOT AIP)
 */
export default async function BarangayHealthProjects() {
  const healthProjects = await projectService.getHealthProjects();

  return <HealthProjectsView projects={healthProjects} scope="barangay" />;
}
