import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { DashboardAip } from "@/features/dashboard/types/dashboard-types";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  pending_review: "bg-amber-50 text-amber-700 border-amber-200",
  under_review: "bg-blue-50 text-blue-700 border-blue-200",
  for_revision: "bg-orange-50 text-orange-700 border-orange-200",
  published: "bg-emerald-50 text-emerald-700 border-emerald-200",
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
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {mode === "summary" ? (
        <>
          <Card className="bg-white border border-gray-200 rounded-xl border-l-4 border-l-orange-400 py-0 shadow-sm"><CardContent className="space-y-2 p-5"><div className="text-xs text-slate-500">AIP Status</div><Badge className={`border ${STATUS_STYLES[selectedAip.status] ?? STATUS_STYLES.draft}`}>{formatStatusLabel(selectedAip.status)}</Badge><div className="text-xs text-slate-500">Updated {formatDateTime(selectedAip.statusUpdatedAt)}</div></CardContent></Card>
          <Card className="bg-white border border-gray-200 rounded-xl border-l-4 border-l-blue-500 py-0 shadow-sm"><CardContent className="space-y-2 p-5"><div className="text-xs text-slate-500">Total Projects</div><div className="text-lg font-semibold text-slate-800">{totalProjects}</div><div className="text-xs text-slate-500">As of today</div></CardContent></Card>
          <Card className="bg-white border border-gray-200 rounded-xl border-l-4 border-l-green-500 py-0 shadow-sm"><CardContent className="space-y-2 p-5"><div className="text-xs text-slate-500">Total Budget</div><div className="text-lg font-semibold text-slate-800">{totalBudget}</div>{missingTotalCount > 0 ? <Badge variant="outline" className="bg-amber-100 text-amber-800 border-transparent">{missingTotalCount} missing totals</Badge> : <div className="text-xs text-slate-500">All project totals available</div>}</CardContent></Card>
          <Card className="bg-white border border-gray-200 rounded-xl border-l-4 border-l-amber-500 py-0 shadow-sm"><CardContent className="space-y-2 p-5"><div className="text-xs text-slate-500">Citizen Feedback</div><div className="text-lg font-semibold text-slate-800">{citizenFeedbackCount}</div><div className="text-xs text-slate-500">Awaiting reply: {awaitingReplyCount}</div></CardContent></Card>
        </>
      ) : (
        <>
          <Card className="bg-white border border-gray-200 rounded-xl border-l-4 border-l-orange-400 py-0 shadow-sm"><CardContent className="space-y-2 p-5"><div className="text-xs text-slate-500">Pending Review</div><div className="text-lg font-semibold text-slate-800">{pendingReviewCount}</div><div className="text-xs text-slate-500">Across {totalAips} AIP records</div></CardContent></Card>
          <Card className="bg-white border border-gray-200 rounded-xl border-l-4 border-l-blue-500 py-0 shadow-sm"><CardContent className="space-y-2 p-5"><div className="text-xs text-slate-500">Under Review</div><div className="text-lg font-semibold text-slate-800">{underReviewCount}</div><div className="text-xs text-slate-500">Current reviewer workload</div></CardContent></Card>
          <Card className="bg-white border border-gray-200 rounded-xl border-l-4 border-l-green-500 py-0 shadow-sm"><CardContent className="space-y-2 p-5"><div className="text-xs text-slate-500">For Revision</div><div className="text-lg font-semibold text-slate-800">{forRevisionCount}</div><div className="text-xs text-slate-500">Items needing revision</div></CardContent></Card>
          <Card className="bg-white border border-gray-200 rounded-xl border-l-4 border-l-amber-500 py-0 shadow-sm"><CardContent className="space-y-2 p-5"><div className="text-xs text-slate-500">Oldest Pending</div><div className="text-lg font-semibold text-slate-800">{oldestPendingDays ?? 0}</div><div className="text-xs text-slate-500">days in queue</div></CardContent></Card>
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
      <div className="bg-white border border-gray-200 rounded-xl p-5"><div className="text-xs text-slate-500">New This Week</div><div className="text-3xl font-semibold text-slate-800">{newThisWeek}</div></div>
      <div className="bg-white border border-gray-200 rounded-xl p-5"><div className="text-xs text-slate-500">Awaiting Reply</div><div className="text-3xl font-semibold text-orange-600">{awaitingReply}</div></div>
      <div className="bg-white border border-gray-200 rounded-xl p-5"><div className="text-xs text-slate-500">Moderated</div><div className="text-3xl font-semibold text-slate-800">{lguNotesPosted}</div></div>
    </div>
  );
}
