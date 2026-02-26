import { AddInformationPage } from "@/features/projects";
import { getUser } from "@/lib/actions/auth.actions";
import { projectService } from "@/lib/repos/projects/queries";
import { notFound } from "next/navigation";

export default async function HealthAddInformationRoute({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { fullName, role, officeLabel } = await getUser();
  const { projectId } = await params;
  const project = await projectService.getHealthProjectById(projectId, {
    publishedOnly: true,
  });

  if (!project) {
    return notFound();
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
        position: role === "citizen" ? "Citizen" : "City Official",
        office: officeLabel || "City Hall",
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
