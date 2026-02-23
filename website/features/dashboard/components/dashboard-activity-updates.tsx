import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardRun } from "@/features/dashboard/types/dashboard-types";
import { formatPipelineStatus, formatStageLabel } from "@/features/dashboard/utils/dashboard-selectors";

function formatDateTime(value: string | null): string {
  if (!value) return "N/A";
  return new Date(value).toLocaleString("en-PH", { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function RecentActivityFeed({ runs }: { runs: DashboardRun[] }) {
  return (
    <Card className="bg-white border border-gray-200 rounded-xl py-0 shadow-sm">
      <CardHeader className="p-5 pb-0"><CardTitle className="text-sm font-medium text-slate-700">Recent Activity</CardTitle></CardHeader>
      <CardContent className="p-5 space-y-2">
        {runs.map((run) => (
          <div key={run.id} className="rounded-lg border border-gray-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">{formatStageLabel(run.stage)}</span>
              <Badge variant="outline">{formatPipelineStatus(run.status)}</Badge>
            </div>
            <div className="mt-1 text-sm text-slate-600">{run.errorMessage ?? "Pipeline activity recorded."}</div>
            <div className="mt-1 text-xs text-slate-500">{formatDateTime(run.startedAt ?? run.createdAt)}</div>
          </div>
        ))}
        {runs.length === 0 && <div className="rounded-lg border border-gray-200 bg-slate-50 p-3 text-sm text-slate-500">No extraction runs for this AIP yet.</div>}
        <div className="rounded-lg border border-gray-200 bg-white p-3 text-center text-sm text-slate-600">View Audit and Accountability</div>
      </CardContent>
    </Card>
  );
}

export function RecentProjectUpdatesCard({
  flaggedProjects,
  failedPipelineStages,
  editableSummary,
  financialSummary,
}: {
  flaggedProjects: number;
  failedPipelineStages: number;
  editableSummary: string;
  financialSummary: string;
}) {
  const updates = [
    {
      id: "flagged",
      title: "Flagged Projects",
      subtitle: `${flaggedProjects} project(s) currently flagged.`,
      meta: "Updated recently",
      tag: "Project",
    },
    {
      id: "pipeline",
      title: "Failed Pipeline Stages",
      subtitle: `${failedPipelineStages} stage(s) failed in latest runs.`,
      meta: "Operational status",
      tag: "Pipeline",
    },
    {
      id: "editable",
      title: "Editable Window",
      subtitle: editableSummary,
      meta: "Policy-based gate",
      tag: "AIP",
    },
    {
      id: "financial",
      title: "Financial Sum Check (PS+MOOE+CO)",
      subtitle: financialSummary,
      meta: "Computed total",
      tag: "Finance",
    },
  ];

  return (
    <Card className="bg-white border border-gray-200 rounded-xl py-0 shadow-sm">
      <CardHeader className="p-5 pb-0"><CardTitle className="text-sm font-medium text-slate-700">Recent Project Updates</CardTitle></CardHeader>
      <CardContent className="p-5 space-y-2 text-sm">
        {updates.map((update) => (
          <div key={update.id} className="rounded-lg border border-gray-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-semibold text-slate-700">{update.title}</div>
              <Badge variant="outline">{update.tag}</Badge>
            </div>
            <div className="mt-1 text-sm text-slate-600">{update.subtitle}</div>
            <div className="mt-1 text-xs text-slate-500">{update.meta}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
