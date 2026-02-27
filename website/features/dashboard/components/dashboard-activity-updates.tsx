import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  DashboardProjectUpdateLog,
  DashboardRun,
} from "@/features/dashboard/types/dashboard-types";
import { formatPipelineStatus, formatStageLabel } from "@/features/dashboard/utils/dashboard-selectors";

function formatDateTime(value: string | null): string {
  if (!value) return "N/A";
  return new Date(value).toLocaleString("en-PH", { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function RecentActivityFeed({
  runs,
  auditHref,
}: {
  runs: DashboardRun[];
  auditHref: "/barangay/audit" | "/city/audit";
}) {
  return (
    <Card className="bg-card text-card-foreground border border-border rounded-xl py-0">
      <CardHeader className="p-5 pb-0"><CardTitle className="text-sm font-medium text-foreground">Recent Activity</CardTitle></CardHeader>
      <CardContent className="p-5 space-y-2 max-h-[728px] overflow-auto">
        {runs.map((run) => (
          <div key={run.id} className="rounded-lg border border-border bg-secondary p-3 hover:bg-accent">
            <div className="flex items-center justify-between">
              <span className="truncate text-sm font-semibold text-foreground">{formatStageLabel(run.stage)}</span>
              <Badge className="rounded-md border border-border bg-card text-muted-foreground">{formatPipelineStatus(run.status)}</Badge>
            </div>
            <div className="mt-1 truncate text-sm text-foreground">{run.errorMessage ?? "Pipeline activity recorded."}</div>
            <div className="mt-1 text-xs tabular-nums text-muted-foreground">{formatDateTime(run.startedAt ?? run.createdAt)}</div>
          </div>
        ))}
        {runs.length === 0 && <div className="rounded-lg border border-border bg-secondary p-3 text-sm text-muted-foreground">No extraction runs for this AIP yet.</div>}
        <Button
          asChild
          variant="ghost"
          className="h-auto rounded-lg border border-border bg-card p-3 text-center text-sm text-primary hover:underline"
        >
          <Link href={auditHref}>View Audit and Accountability</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export function RecentProjectUpdatesCard({
  logs,
}: {
  logs: DashboardProjectUpdateLog[];
}) {
  const sortedLogs = [...logs].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );

  const getTagLabel = (action: DashboardProjectUpdateLog["action"]): "Add Information" | "Post Update" => {
    if (action === "project_info_updated") return "Add Information";
    return "Post Update";
  };

  return (
    <Card className="bg-card text-card-foreground border border-border rounded-xl py-0 w-full min-w-0 flex flex-col min-h-0 max-h-[418px]">
      <CardHeader className="shrink-0 p-5 pb-0"><CardTitle className="text-sm font-medium text-foreground">Recent Project Updates</CardTitle></CardHeader>
      <CardContent className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden [scrollbar-gutter:stable] p-5 pr-4 space-y-2 text-sm">
        {sortedLogs.map((log) => (
          <div key={log.id} className="w-full rounded-lg border border-border bg-secondary p-3 hover:bg-accent">
            <div className="flex min-w-0 items-center justify-between gap-2">
              <div className="min-w-0 truncate text-sm font-semibold text-foreground">{log.title}</div>
              <Badge className="shrink-0 rounded-md border border-border bg-card text-muted-foreground">
                {getTagLabel(log.action)}
              </Badge>
            </div>
            <div className="mt-1 min-w-0 truncate text-sm text-foreground">{log.body || "No description provided."}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {`${log.projectRefCode} • ${log.actorName} • ${formatDateTime(log.createdAt)}`}
            </div>
          </div>
        ))}
        {sortedLogs.length === 0 && (
          <div className="rounded-lg border border-border bg-secondary p-3 text-sm text-muted-foreground">
            No add-information or project-update logs yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
