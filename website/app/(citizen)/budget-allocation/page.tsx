import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const CitizenBudgetAllocationPage = () => {
  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Budget Allocation</h1>
      <p className="max-w-3xl text-sm leading-relaxed text-slate-600">
        View how public funds are distributed by service category and priority area to support transparent,
        evidence-based monitoring for citizens and stakeholders.
      </p>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-base text-slate-900">Coming soon</CardTitle>
          <CardDescription>
            Allocation charts, yearly comparisons, and category-level summaries will be available on this page.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-slate-500">
          Citizens will be able to inspect allocations per LGU and year using interactive visualizations.
        </CardContent>
      </Card>
    </section>
  );
};

export default CitizenBudgetAllocationPage;
