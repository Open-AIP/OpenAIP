import { BarChartCard } from "@/features/dashboard/shared/components/charts";
import { DASHBOARD_SEMANTIC_COLORS } from "@/lib/ui/tokens";
import type { TargetPointVM } from "../types";

type FeedbackTargetsCardProps = {
  targetsSeries: TargetPointVM[];
};

export default function FeedbackTargetsCard({ targetsSeries }: FeedbackTargetsCardProps) {
  return (
    <BarChartCard
      title="Feedback Targets"
      series={{
        data: targetsSeries.map((point) => ({ label: point.label, count: point.count })),
        xKey: "label",
        bars: [{ key: "count", label: "Targets", fill: DASHBOARD_SEMANTIC_COLORS.info }],
      }}
      height={190}
      showLegend={false}
      showGrid
      emptyText="No feedback target data."
      className="gap-3"
    />
  );
}
