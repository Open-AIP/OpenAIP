import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { HealthProject } from "@/types";

function statusPill(status: HealthProject["status"]) {
  switch (status) {
    case "Ongoing":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "Planning":
      return "bg-sky-50 text-sky-700 border-sky-200";
    case "Completed":
      return "bg-slate-50 text-slate-700 border-slate-200";
    case "On Hold":
    default:
      return "bg-amber-50 text-amber-800 border-amber-200";
  }
}

function peso(amount: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function ProjectInformationCard({
  aipYear,
  project,
}: {
  aipYear: number;
  project: HealthProject;
}) {
  return (
    <Card className="border-slate-200">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xs text-slate-400">
              Health Project / <span className="text-slate-600">Detail &amp; Updates</span>
            </div>

            <h1 className="mt-2 text-3xl font-bold text-slate-900">{project.title}</h1>

            <div className="mt-2 text-sm text-slate-500">
              Manage, monitor, and update health-related programs and initiatives under the Annual Investment Program.
            </div>
          </div>

          <Badge variant="outline" className={`rounded-full ${statusPill(project.status)}`}>
            {project.status}
          </Badge>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs text-slate-500">AIP Year</div>
            <div className="mt-1 font-semibold text-slate-900">{aipYear}</div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs text-slate-500">Target Participants</div>
            <div className="mt-1 font-semibold text-slate-900">{project.targetParticipants}</div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs text-slate-500">Total Target</div>
            <div className="mt-1 font-semibold text-slate-900">
              {project.totalTargetParticipants.toLocaleString()}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs text-slate-500">Budget</div>
            <div className="mt-1 font-semibold text-[#022437]">
              {peso(project.budgetAllocated)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
