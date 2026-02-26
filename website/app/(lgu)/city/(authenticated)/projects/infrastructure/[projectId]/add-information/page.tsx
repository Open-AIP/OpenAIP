import { AddInformationPage } from "@/features/projects";
import { getUser } from "@/lib/actions/auth.actions";
import { projectService } from "@/lib/repos/projects/queries";
import { notFound } from "next/navigation";

export default async function InfrastructureAddInformationRoute({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { fullName, role, officeLabel, cityId, scopeName } = await getUser();
  const { projectId } = await params;
  const project = await projectService.getInfrastructureProjectById(projectId, {
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
      kind="infrastructure"
      breadcrumb={[
        { label: "Infrastructure Projects", href: "/city/projects/infrastructure" },
        { label: project.title, href: `/city/projects/infrastructure/${projectId}` },
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
        implementingOffice: project.implementingOffice,
        fundingSource: project.fundingSource,
      }}
    />
  );
}
