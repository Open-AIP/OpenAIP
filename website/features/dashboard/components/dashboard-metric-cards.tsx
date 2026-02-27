import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { DashboardAip } from "@/features/dashboard/types/dashboard-types";
import { AlertCircle, Clock3, FileText, UserCheck, Zap } from "lucide-react";
import type { ReactNode } from "react";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-muted text-foreground",
  pending_review: "bg-warning-soft text-foreground",
  under_review: "bg-info-soft text-foreground",
  for_revision: "bg-warning-soft text-foreground",
  published: "bg-success-soft text-foreground",
};

function formatStatusLabel(status: string): string {
  return status.replaceAll("_", " ").replace(/\b\w/g, (match) => match.toUpperCase());
}

function formatDateTime(value: string | null): string {
  if (!value) return "N/A";
  return new Date(value).toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function KpiCard({
  accent,
  label,
  value,
  meta,
  badge,
}: {
  accent: string;
  label: string;
  value: ReactNode;
  meta?: string;
  badge?: ReactNode;
}) {
  return (
    <Card className={`bg-card text-card-foreground border border-border border-l-4 ${accent} rounded-xl py-0`}>
      <CardContent className="space-y-2 p-5">
        <div className="text-xs leading-tight text-muted-foreground">{label}</div>
        <div className="whitespace-nowrap tabular-nums text-lg font-semibold text-foreground">{value}</div>
        {meta ? <div className="truncate text-xs leading-tight text-muted-foreground">{meta}</div> : null}
        <div className="h-6">{badge}</div>
      </CardContent>
    </Card>
  );
}

function CityOperationalKpiCard({
  label,
  value,
  meta,
  icon,
  iconClassName,
}: {
  label: string;
  value: ReactNode;
  meta: string;
  icon: ReactNode;
  iconClassName: string;
}) {
  return (
    <Card className="rounded-2xl border border-border bg-card py-0 shadow-none">
      <CardContent className="flex items-center justify-between p-5">
        <div className="space-y-1.5">
          <div className="text-sm leading-tight text-muted-foreground">{label}</div>
          <div className="whitespace-nowrap tabular-nums text-4xl font-semibold leading-none text-foreground">{value}</div>
          <div className="text-sm leading-tight text-muted-foreground">{meta}</div>
        </div>
        <div className={iconClassName}>{icon}</div>
      </CardContent>
    </Card>
  );
}

export function KpiRow({
  selectedAip,
  totalProjects,
  totalBudget,
  missingTotalCount,
  citizenFeedbackCount,
  awaitingReplyCount,
  mode,
  pendingReviewCount,
  underReviewCount,
  forRevisionCount,
  totalAips,
  oldestPendingDays,
  scope,
}: {
  selectedAip: DashboardAip;
  totalProjects: number;
  totalBudget: string;
  missingTotalCount: number;
  citizenFeedbackCount: number;
  awaitingReplyCount: number;
  mode: "summary" | "operational";
  pendingReviewCount: number;
  underReviewCount: number;
  forRevisionCount: number;
  totalAips: number;
  oldestPendingDays: number | null;
  scope?: "city" | "barangay";
}) {
  const showCityOperationalKpis = scope === "city" && mode === "operational";

  if (showCityOperationalKpis) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-5">
        <CityOperationalKpiCard
          label="Pending Review"
          value={pendingReviewCount}
          meta="As of today"
          icon={<AlertCircle className="h-6 w-6" strokeWidth={2.2} />}
          iconClassName="shrink-0 text-amber-600"
        />
        <CityOperationalKpiCard
          label="Under Review"
          value={underReviewCount}
          meta="As of today"
          icon={<Clock3 className="h-6 w-6" strokeWidth={2.2} />}
          iconClassName="shrink-0 text-blue-600"
        />
        <CityOperationalKpiCard
          label="For Revision"
          value={forRevisionCount}
          meta="As of today"
          icon={<FileText className="h-6 w-6" strokeWidth={2.2} />}
          iconClassName="shrink-0 text-orange-600"
        />
        <CityOperationalKpiCard
          label="Available to Claim"
          value={pendingReviewCount}
          meta="Ready for review"
          icon={<UserCheck className="h-6 w-6" strokeWidth={2.2} />}
          iconClassName="shrink-0 text-teal-700"
        />
        <CityOperationalKpiCard
          label="Oldest Pending"
          value={oldestPendingDays ?? 0}
          meta="days in queue"
          icon={<Zap className="h-6 w-6" strokeWidth={2.2} />}
          iconClassName="shrink-0 text-cyan-800"
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {mode === "summary" ? (
        <>
          <KpiCard
            accent="border-l-chart-4"
            label="AIP Status"
            value={
              <Badge variant="secondary" className={`w-fit border-0 ${STATUS_STYLES[selectedAip.status] ?? STATUS_STYLES.draft}`}>
                {formatStatusLabel(selectedAip.status)}
              </Badge>
            }
            meta={`Updated ${formatDateTime(selectedAip.statusUpdatedAt)}`}
          />
          <KpiCard accent="border-l-chart-2" label="Total Projects" value={totalProjects} meta="As of today" />
          <KpiCard
            accent="border-l-chart-3"
            label="Total Budget"
            value={totalBudget}
            meta={missingTotalCount > 0 ? undefined : "All project totals available"}
            badge={
              missingTotalCount > 0 ? (
                <Badge className="rounded-md border border-border bg-[color:var(--color-warning-soft)] text-foreground">{missingTotalCount} missing totals</Badge>
              ) : null
            }
          />
          <KpiCard
            accent="border-l-chart-4"
            label="Citizen Feedback"
            value={citizenFeedbackCount}
            meta={`Awaiting reply: ${awaitingReplyCount}`}
            badge={
              awaitingReplyCount > 0 ? (
                <Badge className="rounded-md border border-border bg-[color:var(--color-warning-soft)] text-foreground">Action Required</Badge>
              ) : null
            }
          />
        </>
      ) : (
        <>
          <KpiCard accent="border-l-chart-4" label="Pending Review" value={pendingReviewCount} meta={`Across ${totalAips} AIP records`} />
          <KpiCard accent="border-l-chart-2" label="Under Review" value={underReviewCount} meta="Current reviewer workload" />
          <KpiCard accent="border-l-chart-3" label="For Revision" value={forRevisionCount} meta="Items needing revision" />
          <KpiCard accent="border-l-chart-4" label="Oldest Pending" value={oldestPendingDays ?? 0} meta="days in queue" />
        </>
      )}
    </div>
  );
}

export function PulseKpis({
  newThisWeek,
  awaitingReply,
  lguNotesPosted,
}: {
  newThisWeek: number;
  awaitingReply: number;
  lguNotesPosted: number;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="text-sm text-muted-foreground">New This Week</div>
        <div className="whitespace-nowrap tabular-nums text-2xl font-semibold text-foreground">{newThisWeek}</div>
      </div>
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="text-sm text-muted-foreground">Awaiting Reply</div>
        <div className="whitespace-nowrap tabular-nums text-2xl font-semibold text-warning">{awaitingReply}</div>
      </div>
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="text-sm text-muted-foreground">Hidden</div>
        <div className="whitespace-nowrap tabular-nums text-2xl font-semibold text-muted-foreground">{lguNotesPosted}</div>
      </div>
    </div>
  );
}
