import { CitizenHealthProjectsView } from "@/features/citizen/projects";
import { getCitizenAipRepo } from "@/lib/repos/citizen-aips";
import { projectService } from "@/lib/repos/projects/queries";

export default async function CitizenHealthProjectsPage() {
  const projects = await projectService.getHealthProjects({
    publishedOnly: true,
  });
  const lguLabel = await getCitizenAipRepo().getDefaultLguLabel();
  const lguOptions = ["All LGUs", lguLabel];

  return (
    <CitizenHealthProjectsView
      projects={projects}
      lguLabel={lguLabel}
      lguOptions={lguOptions}
    />
  );
}
