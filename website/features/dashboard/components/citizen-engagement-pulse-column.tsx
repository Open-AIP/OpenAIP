import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PulseKpis } from "@/features/dashboard/components/pulse-kpis";
import { FeedbackTrendCard } from "@/features/dashboard/components/feedback-trend-card";
import { FeedbackTargetsCard } from "@/features/dashboard/components/feedback-targets-card";
import { RecentFeedbackCard } from "@/features/dashboard/components/recent-feedback-card";
import type { DashboardFeedback } from "@/features/dashboard/types/dashboard-types";

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
    <Card className="border-slate-200 py-0 shadow-sm">
      <CardHeader><CardTitle className="text-xl">Citizen Engagement Pulse</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <PulseKpis newThisWeek={newThisWeek} awaitingReply={awaitingReply} lguNotesPosted={lguNotesPosted} />
        <FeedbackTrendCard points={feedbackTrend} />
        <FeedbackTargetsCard targets={feedbackTargets} />
        <RecentFeedbackCard rows={recentFeedback} replyAction={replyAction} />
      </CardContent>
    </Card>
  );
}
