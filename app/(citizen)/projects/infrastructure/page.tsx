import CitizenInfrastructureProjectsView from "@/features/citizen/projects/views/infrastructure-projects-view";
import { projectService } from "@/lib/repos/projects/queries";
import { getCitizenAipRepo } from "@/lib/repos/citizen-aips";

const CitizenInfrastructureProjects = async () => {
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
};

export default CitizenInfrastructureProjects;
