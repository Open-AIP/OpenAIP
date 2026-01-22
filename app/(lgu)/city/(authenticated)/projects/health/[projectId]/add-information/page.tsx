import AddInformationPage from "@/feature/projects/shared/add-information/add-information-page";
import { getUser } from "@/lib/actions/auth.actions";
import { getHealthProjectById } from "@/mock/aips";

export default async function CityHealthAddInformationRoute({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { fullName, userRole, userLocale } = await getUser();
  const { projectId } = await params;
  const project = getHealthProjectById(projectId);

  if (!project) {
    // Handle project not found
    return <div>Project not found</div>;
  }

  return (
    <AddInformationPage
      kind="health"
      breadcrumb={[
        { label: "Health Projects", href: "/city/projects/health" },
        { label: project.title, href: `/city/projects/health/${projectId}` },
        { label: "Add Information" },
      ]}
      uploader={{
        name: fullName,
        position: userRole === "citizen" ? "Citizen" : "City Official",
        office: userLocale || "City Hall",
      }}
      projectInfo={{
        month: project.month,
        year: String(project.year),
        name: project.title,
        description: project.description,
        implementingOffice: project.implementingOffice,
      }}
    />
  );
}
