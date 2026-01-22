import AddInformationPage from "@/feature/projects/shared/add-information/add-information-page";
import { getUser } from "@/lib/actions/auth.actions";
import { getInfrastructureProjectById } from "@/mock/aips";

export default async function CityInfrastructureAddInformationRoute({
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
        { label: "Infrastructure Projects", href: "/city/projects/infrastructure" },
        { label: project.title, href: `/city/projects/infrastructure/${projectId}` },
        { label: "Add Information" },
      ]}
      uploader={{
        name: fullName,
        position: userRole === "citizen" ? "Citizen" : "City Official",
        office: userLocale || "City Hall",
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
