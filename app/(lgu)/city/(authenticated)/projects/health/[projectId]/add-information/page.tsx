import { AddInformationPage } from "@/features/projects";
import { getUser } from "@/lib/actions/auth.actions";
import { projectService } from "@/lib/repos/projects/queries";

export default async function HealthAddInformationRoute({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { fullName, userRole, userLocale } = await getUser();
  const { projectId } = await params;
  const project = await projectService.getHealthProjectById(projectId);

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
