import { BarChartCard } from "@/features/dashboard/components/charts";
import type { PublicationTimelinePointVM } from "../types";

type PublicationTimelineCardProps = {
  publicationTimeline: PublicationTimelinePointVM[];
};

export default function PublicationTimelineCard({ publicationTimeline }: PublicationTimelineCardProps) {
  return (
    <BarChartCard
      title="Publication Timeline"
      series={{
        data: publicationTimeline.map((point) => ({ year: String(point.year), value: point.value })),
        xKey: "year",
        bars: [{ key: "value", label: "Published", fill: "#22c55e" }],
      }}
      height={190}
      showLegend={false}
      showGrid
      emptyText="No publication timeline data."
      className="gap-4"
    />
  );
}
