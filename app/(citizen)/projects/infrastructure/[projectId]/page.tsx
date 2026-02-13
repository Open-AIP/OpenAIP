import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const CitizenInfrastructureProject = async ({ params }: { params: Promise<{ projectId: string }> }) => {
  const { projectId } = await params;

  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Infrastructure Project Details</h1>
      <p className="max-w-3xl text-sm leading-relaxed text-slate-600">
        This page will provide details on the selected infrastructure project, including milestones and status updates.
      </p>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-base text-slate-900">Coming soon</CardTitle>
          <CardDescription>
            Project scope, budget, and implementation updates will be shown here.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-slate-500">Project ID: {projectId}</CardContent>
      </Card>
    </section>
  );
};

export default CitizenInfrastructureProject;
