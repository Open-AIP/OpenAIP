import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const CitizenHealthProjects = () => {
  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Health Projects</h1>
      <p className="max-w-3xl text-sm leading-relaxed text-slate-600">
        Review health-related projects funded through AIPs, including community clinics, wellness programs, and
        preventive care initiatives.
      </p>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-base text-slate-900">Coming soon</CardTitle>
          <CardDescription>
            This page will list health projects with budgets, timelines, and implementation updates.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-slate-500">
          Search and filter tools for health projects will be added in a follow-up update.
        </CardContent>
      </Card>
    </section>
  );
};

export default CitizenHealthProjects;
