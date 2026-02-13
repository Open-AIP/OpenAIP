import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const CitizenHealthProject = async ({ params }: { params: Promise<{ projectId: string }> }) => {
  const { projectId } = await params;

  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Health Project Details</h1>
      <p className="max-w-3xl text-sm leading-relaxed text-slate-600">
        This page will summarize the selected health project, its objectives, and public status updates.
      </p>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-base text-slate-900">Coming soon</CardTitle>
          <CardDescription>
            Detailed project information and progress updates will appear here.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-slate-500">Project ID: {projectId}</CardContent>
      </Card>
    </section>
  );
};

export default CitizenHealthProject;
