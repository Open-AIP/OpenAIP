import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CitizenProjectsPage() {
  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Projects</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-slate-600">
          Browse ongoing and completed projects funded through AIPs, including project objectives,
          implementing offices, and public-facing progress information.
        </p>
      </header>

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
