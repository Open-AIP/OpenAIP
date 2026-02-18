import Link from "next/link";
import { Building2, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatPeso } from "@/lib/formatting";
import type { CitizenDashboardProjectCardVM } from "@/lib/types/viewmodels/dashboard";

type TopFundedProjectsSectionProps = {
  projects: CitizenDashboardProjectCardVM[];
};

export default function TopFundedProjectsSection({ projects }: TopFundedProjectsSectionProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-3xl font-semibold text-slate-900">Top Funded Projects</h3>
      {projects.length === 0 ? (
        <Card className="border-dashed border-slate-300">
          <CardContent className="p-6 text-sm text-slate-500">No projects match current filters.</CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.slice(0, 6).map((project) => (
            <Card key={project.projectId} className="border-slate-200">
              <CardContent className="space-y-3 p-4">
                <div className="grid h-28 place-items-center rounded-xl bg-slate-100 text-slate-300">
                  {project.projectType === "health" ? <Heart className="h-10 w-10" /> : <Building2 className="h-10 w-10" />}
                </div>
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="line-clamp-2 text-sm font-semibold text-slate-900">{project.title}</h4>
                    <Badge variant="outline" className="capitalize">
                      {project.projectType}
                    </Badge>
                  </div>
                  <p className="text-3xl font-semibold text-[#0b5188]">{formatPeso(project.budget)}</p>
                </div>
                <Button asChild variant="outline" className="w-full border-[#0b5188] text-[#0b5188] hover:bg-[#0b5188] hover:text-white">
                  <Link href={project.href}>View Project</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
