import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const CitizenAipsPage = () => {
  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">AIPs</h1>
      <p className="max-w-3xl text-sm leading-relaxed text-slate-600">
        Review published Annual Investment Programs to understand what projects are funded, where they are
        implemented, and how resources are allocated across communities.
      </p>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-base text-slate-900">Coming soon</CardTitle>
          <CardDescription>
            This page will provide searchable AIP listings, summary metrics, and links to detailed project records.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-slate-500">
          Filters, publication status, and downloadable references will appear here in the next iteration.
        </CardContent>
      </Card>
    </section>
  );
};

export default CitizenAipsPage;
