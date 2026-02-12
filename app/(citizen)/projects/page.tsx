import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const CitizenProjectsPage = () => {
  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Projects</h1>
      <p className="max-w-3xl text-sm leading-relaxed text-slate-600">
        Browse ongoing and completed projects funded through AIPs, including project objectives, implementing offices,
        and public-facing progress information.
      </p>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-base text-slate-900">Coming soon</CardTitle>
          <CardDescription>
            This section will consolidate project cards, timelines, and status updates for infrastructure and health
            initiatives.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-slate-500">
          Expanded project filters and drill-down analytics will be added in a follow-up update.
        </CardContent>
      </Card>
    </section>
  );
};

export default CitizenProjectsPage;
