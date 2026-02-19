import { AddInformationPage } from "@/features/projects";
import { getUser } from "@/lib/actions/auth.actions";
import { projectService } from "@/lib/repos/projects/queries";

export default async function InfrastructureAddInformationRoute({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { fullName, role, officeLabel } = await getUser();
  const { projectId } = await params;
  const project = await projectService.getInfrastructureProjectById(projectId);

  if (!project) {
    // Handle project not found
    return <div>Project not found</div>;
  }

  return (
    <AddInformationPage
      kind="infrastructure"
      breadcrumb={[
        { label: "Infrastructure Projects", href: "/barangay/projects/infrastructure" },
        { label: project.title, href: `/barangay/projects/infrastructure/${projectId}` },
        { label: "Add Information" },
      ]}
      uploader={{
        name: fullName,
        position: role === "citizen" ? "Citizen" : "Barangay Official",
        office: officeLabel,
      }}
      projectInfo={{
        name: project.title,
        description: project.description,
        implementingOffice: project.implementingOffice,
        fundingSource: project.fundingSource,
      }}
    />
  );
}
