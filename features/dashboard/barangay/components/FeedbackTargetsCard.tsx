import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TargetPointVM } from "../types";

type FeedbackTargetsCardProps = {
  targetsSeries: TargetPointVM[];
};

export default function FeedbackTargetsCard({ targetsSeries }: FeedbackTargetsCardProps) {
  const maxValue = Math.max(...targetsSeries.map((point) => point.count), 1);
  const width = 520;
  const height = 190;
  const paddingTop = 20;
  const paddingBottom = 46;
  const paddingLeft = 14;
  const paddingRight = 14;
  const chartHeight = 130;
  const chartBottom = paddingTop + chartHeight;
  const plotWidth = width - paddingLeft - paddingRight;
  const barSpace = plotWidth / Math.max(targetsSeries.length, 1);
  const barWidth = Math.min(90, barSpace * 0.55);
  const horizontalGridLines = 4;

  return (
    <Card className="gap-3 border-slate-200 py-4">
      <CardHeader className="px-4">
        <CardTitle className="text-sm font-semibold">Feedback Targets</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="w-full overflow-x-auto text-blue-500">
          <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
            {Array.from({ length: horizontalGridLines + 1 }).map((_, index) => {
              const y = paddingTop + (index / horizontalGridLines) * chartHeight;
              return (
                <line
                  key={`targets-h-grid-${index}`}
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#cbd5e1"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
              );
            })}
            {targetsSeries.map((point, index) => {
              const barHeight = (point.count / maxValue) * chartHeight;
              const slotLeft = paddingLeft + index * barSpace;
              const x = slotLeft + (barSpace - barWidth) / 2;
              const y = chartBottom - barHeight;
              const centerX = slotLeft + barSpace / 2;

              return (
                <g key={point.label}>
                  <line
                    x1={centerX}
                    y1={paddingTop}
                    x2={centerX}
                    y2={chartBottom}
                    stroke="#cbd5e1"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                  <rect x={x} y={y} width={barWidth} height={barHeight} rx={6} fill="currentColor" />
                  <text x={centerX} y={height - paddingBottom / 2} textAnchor="middle" className="fill-slate-500 text-[10px]">
                    {point.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </CardContent>
    </Card>
  );
}
