import CitizenInfrastructureProjectsView from "@/features/citizen/projects/views/infrastructure-projects-view";
import { projectService } from "@/lib/repos/projects/queries";
import { AIPS_TABLE } from "@/mocks/fixtures/aip/aips.table.fixture";

const getDefaultBarangayLabel = () => {
  const barangayAips = AIPS_TABLE.filter((aip) => aip.scope === "barangay");
  const latest = barangayAips.sort((a, b) => b.year - a.year)[0];
  return latest?.barangayName ?? "Barangay";
};

const CitizenInfrastructureProjects = async () => {
  const projects = await projectService.getInfrastructureProjects();
  const barangayLabel = getDefaultBarangayLabel();
  const lguOptions = ["All LGUs", barangayLabel];

  return (
    <CitizenInfrastructureProjectsView
      projects={projects}
      barangayLabel={barangayLabel}
      lguOptions={lguOptions}
    />
  );
};

export default CitizenInfrastructureProjects;
