import CitizenInfrastructureProjectsView from "@/features/citizen/projects/views/infrastructure-projects-view";
import { projectService } from "@/lib/repos/projects/queries";
import { AIPS_TABLE } from "@/mocks/fixtures/aip/aips.table.fixture";

const getDefaultLguLabel = () => {
  const barangayAips = AIPS_TABLE.filter((aip) => aip.scope === "barangay");
  const latest = barangayAips.sort((a, b) => b.year - a.year)[0];
  return latest?.barangayName ?? "Barangay";
};

const CitizenInfrastructureProjects = async () => {
  const projects = await projectService.getInfrastructureProjects();
  const lguLabel = getDefaultLguLabel();
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
