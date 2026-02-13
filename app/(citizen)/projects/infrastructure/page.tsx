import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const CitizenInfrastructureProjects = () => {
  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Infrastructure Projects</h1>
      <p className="max-w-3xl text-sm leading-relaxed text-slate-600">
        Explore infrastructure projects funded by AIPs, including roads, drainage, public facilities, and community
        upgrades.
      </p>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-base text-slate-900">Coming soon</CardTitle>
          <CardDescription>
            This page will display infrastructure project cards with progress, budgets, and milestones.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-slate-500">
          Detailed project filters and geographic views will be added in the next release.
        </CardContent>
      </Card>
    </section>
  );
};

export default CitizenInfrastructureProjects;
