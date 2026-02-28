import { AddInformationPage } from "@/features/projects";
import { getUser } from "@/lib/actions/auth.actions";
import { projectService } from "@/lib/repos/projects/queries";
import { notFound } from "next/navigation";

export default async function HealthAddInformationRoute({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { fullName, role, officeLabel, cityId, scopeName } = await getUser();
  const { projectId } = await params;
  const project = await projectService.getHealthProjectById(projectId, {
    cityId,
    cityScopeName: scopeName,
    publishedOnly: true,
  });

  if (!project) {
    return notFound();
  }

  return (
    <AddInformationPage
      projectId={project.id}
      scope="city"
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
        name: project.title,
        description: project.description,
        startDate: project.startDate,
        targetCompletionDate: project.targetCompletionDate,
        budgetAllocated: String(project.budgetAllocated ?? ""),
        implementingOffice: project.implementingOffice,
        totalTargetParticipants: String(project.totalTargetParticipants ?? ""),
        targetParticipants: project.targetParticipants ?? "",
        status: project.status,
      }}
    />
  );
}
