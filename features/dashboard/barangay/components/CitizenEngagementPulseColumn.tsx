import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PulseKpisVM, RecentFeedbackItemVM, TargetPointVM, TrendPointVM } from "../types";
import FeedbackTargetsCard from "./FeedbackTargetsCard";
import FeedbackTrendCard from "./FeedbackTrendCard";
import PulseKpis from "./PulseKpis";
import RecentFeedbackCard from "./RecentFeedbackCard";

type CitizenEngagementPulseColumnProps = {
  kpis: PulseKpisVM;
  trendSeries: TrendPointVM[];
  targetsSeries: TargetPointVM[];
  recentFeedback: RecentFeedbackItemVM[];
};

export default function CitizenEngagementPulseColumn({
  kpis,
  trendSeries,
  targetsSeries,
  recentFeedback,
}: CitizenEngagementPulseColumnProps) {
  return (
    <Card className="gap-4 border-slate-200 py-4">
      <CardHeader className="px-4">
        <CardTitle className="text-2xl font-semibold">Citizen Engagement Pulse</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-4">
        <PulseKpis kpis={kpis} />
        <FeedbackTrendCard trendSeries={trendSeries} />
        <FeedbackTargetsCard targetsSeries={targetsSeries} />
        <RecentFeedbackCard recentFeedback={recentFeedback} />
      </CardContent>
    </Card>
  );
}
