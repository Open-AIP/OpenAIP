import HealthProjectsView from "@/features/projects/health/views/health-projects-view";
import { projectService } from "@/features/projects/services";

/**
 * DATA ISOLATION: Uses Projects service only (NOT AIP)
 */
export default async function BarangayHealthProjects() {
  const healthProjects = await projectService.getHealthProjects();

  return <HealthProjectsView projects={healthProjects} scope="barangay" />;
}
