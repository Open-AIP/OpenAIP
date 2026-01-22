import AddInformationPage from "@/feature/projects/shared/add-information/add-information-page";
import { getUser } from "@/lib/actions/auth.actions";
import { getInfrastructureProjectById } from "@/mock/aips";

export default async function InfrastructureAddInformationRoute({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { fullName, userRole, userLocale } = await getUser();
  const { projectId } = await params;
  const project = getInfrastructureProjectById(projectId);

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
        description: project.description,
        implementingOffice: project.implementingOffice,
        fundingSource: project.fundingSource,
      }}
    />
  );
}
