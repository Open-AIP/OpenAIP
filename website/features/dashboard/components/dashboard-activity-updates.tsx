import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardRun } from "@/features/dashboard/types/dashboard-types";
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
    <Card className="bg-card text-card-foreground border border-border rounded-xl py-0">
      <CardHeader className="p-5 pb-0"><CardTitle className="text-sm font-medium text-foreground">Recent Project Updates</CardTitle></CardHeader>
      <CardContent className="p-5 space-y-2 text-sm max-h-[418px] overflow-auto">
        {updates.map((update) => (
          <div key={update.id} className="rounded-lg border border-border bg-secondary p-3 hover:bg-accent">
            <div className="flex items-center justify-between gap-2">
              <div className="truncate text-sm font-semibold text-foreground">{update.title}</div>
              <Badge className="rounded-md border border-border bg-card text-muted-foreground">{update.tag}</Badge>
            </div>
            <div className="mt-1 truncate text-sm text-foreground">{update.subtitle}</div>
            <div className="mt-1 text-xs text-muted-foreground">{update.meta}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
