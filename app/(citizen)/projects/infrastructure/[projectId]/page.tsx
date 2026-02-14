import { notFound } from "next/navigation";
import CitizenInfrastructureProjectDetailView from "@/features/citizen/projects/views/infrastructure-project-detail-view";
import { projectService } from "@/lib/repos/projects/queries";

const CitizenInfrastructureProjectDetailPage = async ({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) => {
  const { projectId } = await params;
  const project = await projectService.getInfrastructureProjectById(projectId);

  if (!project) {
    notFound();
  }

  return (
    <section className="space-y-6">
      <CitizenInfrastructureProjectDetailView
        aipYear={project.year}
        project={project}
      />
    </section>
  );
};

export default CitizenInfrastructureProjectDetailPage;
