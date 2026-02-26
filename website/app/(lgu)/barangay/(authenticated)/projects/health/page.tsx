import { HealthProjectsView } from "@/features/projects";
import { getUser } from "@/lib/actions/auth.actions";
import { projectService } from "@/lib/repos/projects/queries";

/**
 * DATA ISOLATION: Uses Projects service only (NOT AIP)
 */
export default async function BarangayHealthProjects() {
  const { barangayId, scopeName } = await getUser();
  const healthProjects = await projectService.getHealthProjects({
    barangayId,
    barangayScopeName: scopeName,
    publishedOnly: true,
  });

  return <HealthProjectsView projects={healthProjects} scope="barangay" />;
}
