import { notFound } from "next/navigation";
import { getUser } from "@/lib/actions/auth.actions";
import { projectService } from "@/lib/repos/projects/queries";
import { InfrastructureProjectDetailPageView } from "@/features/projects";

export default async function CityInfrastructureProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { cityId, scopeName } = await getUser();

  const project = await projectService.getInfrastructureProjectById(projectId, {
    cityId,
    cityScopeName: scopeName,
    publishedOnly: true,
  });

  if (!project) return notFound();

  return <InfrastructureProjectDetailPageView aipYear={project.year} project={project} scope="city" />;
}
