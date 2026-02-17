import { LineChartCard } from "@/features/dashboard/components/charts";
import { DASHBOARD_SEMANTIC_COLORS } from "@/lib/ui/tokens";
import type { TrendPointVM } from "../types";

type FeedbackTrendCardProps = {
  trendSeries: TrendPointVM[];
};

export default function FeedbackTrendCard({ trendSeries }: FeedbackTrendCardProps) {
  return (
    <LineChartCard
      title="Feedback Trend"
      series={{
        data: trendSeries.map((point) => ({ label: point.label, value: point.value })),
        xKey: "label",
        lines: [{ key: "value", label: "Feedback", stroke: DASHBOARD_SEMANTIC_COLORS.teal700 }],
      }}
      height={170}
      showLegend={false}
      showGrid
      emptyText="No feedback trend data."
      className="gap-3"
    />
  );
}
