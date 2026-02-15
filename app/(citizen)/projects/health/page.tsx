import CitizenHealthProjectsView from "@/features/citizen/projects/views/health-projects-view";
import { projectService } from "@/lib/repos/projects/queries";
import { getCitizenAipRepo } from "@/lib/repos/citizen-aips/repo";

const CitizenHealthProjects = async () => {
  const projects = await projectService.getHealthProjects();
  const lguLabel = await getCitizenAipRepo().getDefaultLguLabel();
  const lguOptions = ["All LGUs", lguLabel];

  return (
    <CitizenHealthProjectsView
      projects={projects}
      lguLabel={lguLabel}
      lguOptions={lguOptions}
    />
  );
};

export default CitizenHealthProjects;
