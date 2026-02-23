import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MessageSquare } from "lucide-react";
import type { DashboardFeedback } from "@/features/dashboard/types/dashboard-types";

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
    <Card className="bg-card text-card-foreground border border-border rounded-xl py-0">
      <CardContent className="p-5">
        <div className="mb-2 text-sm font-medium text-foreground">Feedback Trend</div>
        <div className="border border-dashed border-border rounded-lg p-6 text-sm text-muted-foreground">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="h-56 w-full" aria-label="Feedback trend chart">
            <line x1={leftPad} y1={topPad + innerHeight} x2={chartWidth - rightPad} y2={topPad + innerHeight} stroke="var(--muted-foreground)" strokeWidth="1" />
            <line x1={leftPad} y1={topPad} x2={leftPad} y2={topPad + innerHeight} stroke="var(--muted-foreground)" strokeWidth="1" />
            {[0, 0.5, 1].map((ratio) => {
              const y = topPad + innerHeight - ratio * innerHeight;
              const label = Math.round(ratio * max);
              return (
                <g key={ratio}>
                  <line x1={leftPad} y1={y} x2={chartWidth - rightPad} y2={y} stroke="var(--border)" strokeDasharray="4 4" />
                  <text x={leftPad - 8} y={y + 4} fontSize="11" textAnchor="end" fill="var(--muted-foreground)">{label}</text>
                </g>
              );
            })}
            {points.map((point, index) => {
              const x = leftPad + index * stepX;
              return (
                <line key={`x-grid-${point.isoDate}`} x1={x} y1={topPad} x2={x} y2={topPad + innerHeight} stroke="var(--border)" strokeDasharray="4 4" />
              );
            })}
            <polyline fill="none" stroke="var(--chart-1)" strokeWidth="2.5" points={linePoints} />
            {points.map((point, index) => {
              const x = leftPad + index * stepX;
              const y = topPad + innerHeight - (point.count / max) * innerHeight;
              return (
                <g key={`dot-${point.isoDate}`}>
                  <circle cx={x} cy={y} r="3.2" fill="var(--card)" stroke="var(--chart-1)" strokeWidth="2" />
                  <text x={x} y={topPad + innerHeight + 16} fontSize="11" textAnchor="middle" fill="var(--muted-foreground)">{point.dayLabel}</text>
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
    <Card className="bg-card text-card-foreground border border-border rounded-xl py-0">
      <CardContent className="p-5">
        <div className="mb-2 text-sm font-medium text-foreground">Feedback Targets</div>
        <div className="border border-dashed border-border rounded-lg p-6 text-sm text-muted-foreground">
          <div className="grid grid-cols-3 items-end gap-3 border-b border-border pb-1 pt-4">
            {targets.map((target) => (
              <div key={target.label} className="space-y-2 text-center">
                <div className="mx-auto w-full max-w-[140px] rounded-t-sm bg-chart-2" style={{ height: `${Math.max(16, Math.round((target.value / max) * 120))}px` }} />
                <div className="text-xs text-muted-foreground">{target.label}</div>
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
    <Card className="bg-card text-card-foreground border border-border rounded-xl py-0">
      <CardContent className="p-5">
        <div className="mb-2 text-sm font-medium text-foreground">Recent Feedback</div>
        <div className="space-y-3 max-h-[520px] overflow-auto">
          {rows.map((item) => (
            <div key={item.id} className="rounded-lg border border-border bg-secondary p-3 hover:bg-accent">
              <div className="flex items-center justify-between">
                <div className="truncate text-sm font-medium text-foreground capitalize">{item.kind.replaceAll("_", " ")}</div>
                <div className="text-xs text-muted-foreground tabular-nums">{formatDateTime(item.createdAt)}</div>
              </div>
              <div className="mt-2 truncate text-sm text-foreground">{item.body}</div>
              <div className="mt-2 text-xs text-muted-foreground">Status: {item.parentFeedbackId ? "Replied" : "Awaiting reply"}</div>
              {replyAction && (
                <form action={replyAction} className="mt-3 flex gap-2">
                  <input type="hidden" name="parentFeedbackId" value={item.id} />
                  <Input name="body" placeholder="Write quick reply..." />
                  <Button type="submit" variant="outline">Reply</Button>
                </form>
              )}
            </div>
          ))}
          {rows.length === 0 && <div className="rounded-lg border border-border p-3 text-sm text-muted-foreground">No recent citizen feedback.</div>}
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
        <MessageSquare className="h-5 w-5 text-foreground" />
        <h2 className="text-lg font-semibold text-foreground">Citizen Engagement Pulse</h2>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 text-card-foreground">
          <div className="text-sm text-muted-foreground">New This Week</div>
          <div className="text-2xl font-semibold tabular-nums text-foreground">{newThisWeek}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 text-card-foreground">
          <div className="text-sm text-muted-foreground">Awaiting Reply</div>
          <div className="text-2xl font-semibold tabular-nums text-destructive">{awaitingReply}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 text-card-foreground">
          <div className="text-sm text-muted-foreground">Hidden</div>
          <div className="text-2xl font-semibold tabular-nums text-muted-foreground">{lguNotesPosted}</div>
        </div>
      </div>
      <FeedbackTrendCard points={feedbackTrend} />
      <FeedbackTargetsCard targets={feedbackTargets} />
      <RecentFeedbackCard rows={recentFeedback} replyAction={replyAction} />
    </section>
  );
}
