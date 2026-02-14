import { notFound } from "next/navigation";
import CitizenHealthProjectDetailView from "@/features/citizen/projects/views/health-project-detail-view";
import { projectService } from "@/lib/repos/projects/queries";

const CitizenHealthProjectDetailPage = async ({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) => {
  const { projectId } = await params;
  const project = await projectService.getHealthProjectById(projectId);

  if (!project) {
    notFound();
  }

  return (
    <section className="space-y-6">
      <CitizenHealthProjectDetailView aipYear={project.year} project={project} />
    </section>
  );
};

export default CitizenHealthProjectDetailPage;
