import { CitizenInfrastructureProjectsView } from "@/features/citizen/projects";
import { getCitizenAipRepo } from "@/lib/repos/citizen-aips";
import { projectService } from "@/lib/repos/projects/queries";

export default async function CitizenInfrastructureProjectsPage() {
  const projects = await projectService.getInfrastructureProjects();
  const lguLabel = await getCitizenAipRepo().getDefaultLguLabel();
  const lguOptions = ["All LGUs", lguLabel];

  return (
    <CitizenInfrastructureProjectsView
      projects={projects}
      lguLabel={lguLabel}
      lguOptions={lguOptions}
    />
  );
}
