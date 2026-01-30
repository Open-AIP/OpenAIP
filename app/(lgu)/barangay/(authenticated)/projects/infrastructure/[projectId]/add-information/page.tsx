import AddInformationPage from "@/features/projects/shared/add-information/add-information-page";
import { getUser } from "@/lib/actions/auth.actions";
import { projectService } from "@/features/projects/services";

export default async function InfrastructureAddInformationRoute({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { fullName, userRole, userLocale } = await getUser();
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
        position: userRole === "citizen" ? "Citizen" : "Barangay Official",
        office: userLocale,
      }}
      projectInfo={{
        name: project.title,
        implementingOffice: project.implementingOffice,
        fundingSource: project.fundingSource,
      }}
    />
  );
}
