import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const AboutUsPage = () => {
  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">About us</h1>
      <p className="max-w-3xl text-sm leading-relaxed text-slate-600">
        OpenAIP promotes transparency by helping citizens understand how local development plans and public funds are
        published, monitored, and communicated.
      </p>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-base text-slate-900">Coming soon</CardTitle>
          <CardDescription>
            This page will present the platform mission, governance model, and accountability commitments.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-slate-500">
          Team background, policy references, and contact channels will be added in the next release.
        </CardContent>
      </Card>
    </section>
  );
};

export default AboutUsPage;
