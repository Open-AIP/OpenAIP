import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { DashboardFeedback } from "@/features/dashboard/types/dashboard-types";
import { PulseKpis } from "@/features/dashboard/components/dashboard-metric-cards";

function tinyBarWidth(value: number, max: number): string {
  if (max <= 0) return "0%";
  return `${Math.max(8, Math.round((value / max) * 100))}%`;
}

export function FeedbackTrendCard({ points }: { points: Array<{ dayLabel: string; isoDate: string; count: number }> }) {
  const max = Math.max(1, ...points.map((row) => row.count));

  return (
    <Card className="bg-white border border-gray-200 rounded-xl py-0 shadow-sm">
      <CardContent className="p-5">
        <div className="mb-2 text-sm font-medium text-slate-700">Feedback Trend</div>
        <div className="border border-dashed border-gray-300 rounded-lg p-6 text-sm text-slate-500">
          <div className="grid grid-cols-7 gap-2">
            {points.map((point) => (
              <div key={point.isoDate} className="space-y-1 text-center">
                <div className="mx-auto h-20 w-5 rounded bg-slate-100">
                  <div className="mt-auto h-full w-full rounded bg-[#0B6477]" style={{ height: tinyBarWidth(point.count, max) }} />
                </div>
                <div className="text-[10px] text-slate-500">{point.dayLabel}</div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function FeedbackTargetsCard({ targets }: { targets: Array<{ label: string; value: number }> }) {
  const max = Math.max(1, ...targets.map((target) => target.value));
  return (
    <Card className="bg-white border border-gray-200 rounded-xl py-0 shadow-sm">
      <CardContent className="p-5">
        <div className="mb-2 text-sm font-medium text-slate-700">Feedback Targets</div>
        <div className="border border-dashed border-gray-300 rounded-lg p-6 text-sm text-slate-500">
          <div className="space-y-2">
            {targets.map((target) => (
              <div key={target.label} className="grid grid-cols-[120px_1fr_28px] items-center gap-2 text-sm">
                <span className="text-slate-600">{target.label}</span>
                <div className="h-2.5 rounded-full bg-slate-100"><div className="h-2.5 rounded-full bg-blue-500" style={{ width: tinyBarWidth(target.value, max) }} /></div>
                <span className="text-slate-700">{target.value}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("en-PH", { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function RecentFeedbackCard({
  rows,
  replyAction,
}: {
  rows: DashboardFeedback[];
  replyAction?: (formData: FormData) => Promise<void>;
}) {
  return (
    <Card className="bg-white border border-gray-200 rounded-xl py-0 shadow-sm">
      <CardContent className="p-5">
        <div className="mb-2 text-sm font-medium text-slate-700">Recent Feedback</div>
        <div className="space-y-3">
          {rows.map((item) => (
            <div key={item.id} className="rounded-lg border border-gray-200 bg-white p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-slate-700 capitalize">{item.kind.replaceAll("_", " ")}</div>
                <div className="text-xs text-slate-500">{formatDateTime(item.createdAt)}</div>
              </div>
              <div className="mt-2 text-sm text-slate-600">{item.body}</div>
              <div className="mt-2 text-xs text-slate-500">Status: {item.parentFeedbackId ? "Replied" : "Awaiting reply"}</div>
              {replyAction && (
                <form action={replyAction} className="mt-3 flex gap-2">
                  <input type="hidden" name="parentFeedbackId" value={item.id} />
                  <Input name="body" placeholder="Write quick reply..." />
                  <Button type="submit" variant="outline">Reply</Button>
                </form>
              )}
            </div>
          ))}
          {rows.length === 0 && <div className="rounded-lg border border-gray-200 p-3 text-sm text-slate-500">No recent citizen feedback.</div>}
        </div>
      </CardContent>
    </Card>
  );
}

export function CitizenEngagementPulseColumn({
  newThisWeek,
  awaitingReply,
  lguNotesPosted,
  feedbackTrend,
  feedbackTargets,
  recentFeedback,
  replyAction,
}: {
  newThisWeek: number;
  awaitingReply: number;
  lguNotesPosted: number;
  feedbackTrend: Array<{ dayLabel: string; isoDate: string; count: number }>;
  feedbackTargets: Array<{ label: string; value: number }>;
  recentFeedback: DashboardFeedback[];
  replyAction?: (formData: FormData) => Promise<void>;
}) {
  return (
    <Card className="bg-white border border-gray-200 rounded-xl py-0 shadow-sm">
      <CardHeader className="p-5 pb-0"><CardTitle className="text-xl font-semibold text-slate-800">Citizen Engagement Pulse</CardTitle></CardHeader>
      <CardContent className="p-5 space-y-4">
        <PulseKpis newThisWeek={newThisWeek} awaitingReply={awaitingReply} lguNotesPosted={lguNotesPosted} />
        <FeedbackTrendCard points={feedbackTrend} />
        <FeedbackTargetsCard targets={feedbackTargets} />
        <RecentFeedbackCard rows={recentFeedback} replyAction={replyAction} />
      </CardContent>
    </Card>
  );
}
