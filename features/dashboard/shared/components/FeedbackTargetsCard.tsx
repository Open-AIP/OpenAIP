import { BarChartCard } from "@/features/dashboard/components/charts";
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
        bars: [{ key: "count", label: "Targets", fill: "#2563eb" }],
      }}
      height={190}
      showLegend={false}
      showGrid
      emptyText="No feedback target data."
      className="gap-3"
    />
  );
}
