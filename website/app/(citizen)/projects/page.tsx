import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import CitizenExplainerCard from "@/features/citizen/components/citizen-explainer-card";
import CitizenPageHero from "@/features/citizen/components/citizen-page-hero";

export default function CitizenProjectsPage() {
  return (
    <section className="space-y-6">
      <CitizenPageHero
        title="Projects"
        subtitle="Browse ongoing and completed projects funded through AIPs, including project objectives, implementing offices, and public-facing progress information."
        eyebrow="OpenAIP"
      />

      <CitizenExplainerCard title="What are AIP-funded projects?">
        <p className="text-sm leading-relaxed text-slate-600 md:text-[15px]">
          These are programs and infrastructure initiatives approved in the Annual Investment Plan.
          Explore them by sector to understand where public funds are directed and what outcomes are planned.
        </p>
      </CitizenExplainerCard>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base text-slate-900">Health Projects</CardTitle>
            <CardDescription>
              Explore health initiatives covering services, facilities, and community wellness.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="bg-[#022437] text-white hover:bg-[#022437]/90">
              <Link href="/projects/health">Open Health Projects</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base text-slate-900">Infrastructure Projects</CardTitle>
            <CardDescription>
              Review infrastructure works including roads, flood control, and facilities.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="bg-[#022437] text-white hover:bg-[#022437]/90">
              <Link href="/projects/infrastructure">Open Infrastructure Projects</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
