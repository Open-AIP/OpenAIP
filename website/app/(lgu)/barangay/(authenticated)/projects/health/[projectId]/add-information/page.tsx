import { AddInformationPage } from "@/features/projects";
import { getUser } from "@/lib/actions/auth.actions";
import { projectService } from "@/lib/repos/projects/queries";
import { notFound } from "next/navigation";

export default async function HealthAddInformationRoute({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { fullName, role, officeLabel, barangayId, scopeName } = await getUser();
  const { projectId } = await params;
  const project = await projectService.getHealthProjectById(projectId, {
    barangayId,
    barangayScopeName: scopeName,
    publishedOnly: true,
  });

  if (!project) {
    return notFound();
  }

  return (
    <AddInformationPage
      projectId={project.id}
      scope="barangay"
      kind="health"
      breadcrumb={[
        { label: "Health Projects", href: "/barangay/projects/health" },
        { label: project.title, href: `/barangay/projects/health/${projectId}` },
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
        startDate: project.startDate,
        targetCompletionDate: project.targetCompletionDate,
        budgetAllocated: String(project.budgetAllocated ?? ""),
        implementingOffice: project.implementingOffice,
      }}
    />
  );
}
