import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MessageSquare } from "lucide-react";
import type { DashboardFeedback } from "@/features/dashboard/types/dashboard-types";
import { PulseKpis } from "@/features/dashboard/components/dashboard-metric-cards";

export function FeedbackTrendCard({ points }: { points: Array<{ dayLabel: string; isoDate: string; count: number }> }) {
  const max = Math.max(1, ...points.map((row) => row.count));
  const chartWidth = 520;
  const chartHeight = 180;
  const leftPad = 40;
  const rightPad = 10;
  const topPad = 14;
  const bottomPad = 28;
  const innerWidth = chartWidth - leftPad - rightPad;
  const innerHeight = chartHeight - topPad - bottomPad;
  const stepX = points.length > 1 ? innerWidth / (points.length - 1) : innerWidth;
  const linePoints = points
    .map((point, index) => {
      const x = leftPad + index * stepX;
      const y = topPad + innerHeight - (point.count / max) * innerHeight;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <Card className="bg-white border border-gray-200 rounded-xl py-0 shadow-sm">
      <CardContent className="p-5">
        <div className="mb-2 text-3xl font-medium text-slate-800">Feedback Trend</div>
        <div className="border border-dashed border-gray-300 rounded-lg p-6 text-sm text-slate-500">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="h-56 w-full" aria-label="Feedback trend chart">
            <line x1={leftPad} y1={topPad + innerHeight} x2={chartWidth - rightPad} y2={topPad + innerHeight} stroke="#64748B" strokeWidth="1" />
            <line x1={leftPad} y1={topPad} x2={leftPad} y2={topPad + innerHeight} stroke="#64748B" strokeWidth="1" />
            {[0, 0.5, 1].map((ratio) => {
              const y = topPad + innerHeight - ratio * innerHeight;
              const label = Math.round(ratio * max);
              return (
                <g key={ratio}>
                  <line x1={leftPad} y1={y} x2={chartWidth - rightPad} y2={y} stroke="#CBD5E1" strokeDasharray="4 4" />
                  <text x={leftPad - 8} y={y + 4} fontSize="11" textAnchor="end" fill="#64748B">{label}</text>
                </g>
              );
            })}
            {points.map((point, index) => {
              const x = leftPad + index * stepX;
              return (
                <line key={`x-grid-${point.isoDate}`} x1={x} y1={topPad} x2={x} y2={topPad + innerHeight} stroke="#CBD5E1" strokeDasharray="4 4" />
              );
            })}
            <polyline fill="none" stroke="#0B6477" strokeWidth="2.5" points={linePoints} />
            {points.map((point, index) => {
              const x = leftPad + index * stepX;
              const y = topPad + innerHeight - (point.count / max) * innerHeight;
              return (
                <g key={`dot-${point.isoDate}`}>
                  <circle cx={x} cy={y} r="3.2" fill="#fff" stroke="#0B6477" strokeWidth="2" />
                  <text x={x} y={topPad + innerHeight + 16} fontSize="11" textAnchor="middle" fill="#64748B">{point.dayLabel}</text>
                </g>
              );
            })}
          </svg>
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
        <div className="mb-2 text-3xl font-medium text-slate-800">Feedback Targets</div>
        <div className="border border-dashed border-gray-300 rounded-lg p-6 text-sm text-slate-500">
          <div className="grid grid-cols-3 items-end gap-3 border-b border-slate-400 pb-1 pt-4">
            {targets.map((target) => (
              <div key={target.label} className="space-y-2 text-center">
                <div className="mx-auto w-full max-w-[140px] rounded-t-sm bg-blue-500" style={{ height: `${Math.max(16, Math.round((target.value / max) * 120))}px` }} />
                <div className="text-xs text-slate-500">{target.label}</div>
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
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-[#0B6477]" />
        <h2 className="text-4xl font-semibold text-slate-900">Citizen Engagement Pulse</h2>
      </div>
      <PulseKpis newThisWeek={newThisWeek} awaitingReply={awaitingReply} lguNotesPosted={lguNotesPosted} />
      <FeedbackTrendCard points={feedbackTrend} />
      <FeedbackTargetsCard targets={feedbackTargets} />
      <RecentFeedbackCard rows={recentFeedback} replyAction={replyAction} />
    </section>
  );
}
