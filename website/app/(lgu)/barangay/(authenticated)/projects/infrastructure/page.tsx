import { InfrastructureProjectsView } from "@/features/projects";
import { getUser } from "@/lib/actions/auth.actions";
import { projectService } from "@/lib/repos/projects/queries";

export default async function BarangayInfrastructureProjects() {
  const { barangayId, scopeName } = await getUser();
  const infrastructureProjects = await projectService.getInfrastructureProjects({
    barangayId,
    barangayScopeName: scopeName,
    publishedOnly: true,
  });

  return <InfrastructureProjectsView projects={infrastructureProjects} scope="barangay" />;
}
