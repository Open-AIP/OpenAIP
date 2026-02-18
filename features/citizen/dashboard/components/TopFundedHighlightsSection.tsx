import Link from "next/link";
import { ArrowRight, Building2, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatPeso } from "@/lib/formatting";
import type { CitizenDashboardHighlightProjectVM } from "@/lib/types/viewmodels/dashboard";

type TopFundedHighlightsSectionProps = {
  projects: CitizenDashboardHighlightProjectVM[];
};

export default function TopFundedHighlightsSection({ projects }: TopFundedHighlightsSectionProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2 text-center">
        <h2 className="text-4xl font-semibold text-[#0b5188]">Top Funded Project Highlights</h2>
        <p className="text-base text-slate-500">Featured health and infrastructure projects with highest allocations</p>
      </div>

      {projects.length === 0 ? (
        <Card className="border-dashed border-slate-300">
          <CardContent className="p-6 text-sm text-slate-500">No highlight projects available.</CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
            {projects.slice(0, 2).map((project) => {
              const isHealth = project.projectType === "health";
              const typeLabel =
                project.projectType === "health"
                  ? "Health"
                  : project.projectType === "infrastructure"
                    ? "Infrastructure"
                    : "Other";
              return (
                <Card key={project.projectId} className="overflow-hidden border-slate-200">
                <div
                  className={
                    isHealth
                      ? "relative h-52 bg-gradient-to-b from-[#f5e6ef] via-[#d6c6ce] to-[#8d8085]"
                      : "relative h-52 bg-gradient-to-b from-[#dce9f4] via-[#a3b5bf] to-[#57656d]"
                  }
                >
                  <div className="absolute left-4 top-4">
                    <Badge className={isHealth ? "bg-pink-600 text-white" : "bg-blue-600 text-white"}>{typeLabel}</Badge>
                  </div>
                  <div className="absolute right-4 top-4">
                    <Badge variant="outline" className="rounded-full border-none bg-white px-3 py-1 text-base font-semibold text-[#0b5188]">
                      {formatPeso(project.budget)}
                    </Badge>
                  </div>
                  <div className="absolute inset-0 grid place-items-center text-white/35">
                    {isHealth ? <Heart className="h-16 w-16" /> : <Building2 className="h-16 w-16" />}
                  </div>
                </div>
                <CardContent className="space-y-3 p-5">
                  <h3 className="text-3xl font-semibold tracking-tight text-slate-900">{project.title}</h3>
                  <p className="text-sm text-slate-600">
                    {project.scopeName} - FY {project.fiscalYear}
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-slate-500">Source: Published AIP</p>
                    <Button asChild className={isHealth ? "bg-pink-600 hover:bg-pink-700" : "bg-blue-600 hover:bg-blue-700"}>
                      <Link href={project.href}>
                        Explore {isHealth ? "Health" : "Infrastructure"} Projects
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
