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
    <Card className="border-slate-200 py-0 shadow-sm">
      <CardHeader className="pb-2"><CardTitle className="text-base">Recent Activity</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        <div className="grid grid-cols-[1fr_auto_auto] gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500"><span>Stage</span><span>Status</span><span>Started</span></div>
        {runs.map((run) => (
          <div key={run.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm">
            <span className="text-slate-700">{formatStageLabel(run.stage)}</span>
            <Badge className={`border ${run.status === "failed" ? "border-rose-200 bg-rose-50 text-rose-700" : run.status === "succeeded" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-blue-200 bg-blue-50 text-blue-700"}`}>{formatPipelineStatus(run.status)}</Badge>
            <span className="text-xs text-slate-500">{formatDateTime(run.startedAt ?? run.createdAt)}</span>
          </div>
        ))}
        {runs.length === 0 && <div className="rounded-md border border-slate-200 px-3 py-4 text-sm text-slate-500">No extraction runs for this AIP yet.</div>}
      </CardContent>
    </Card>
  );
}
