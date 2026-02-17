import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TrendPointVM } from "../types";

type FeedbackTrendCardProps = {
  trendSeries: TrendPointVM[];
};

export default function FeedbackTrendCard({ trendSeries }: FeedbackTrendCardProps) {
  const maxValue = Math.max(...trendSeries.map((point) => point.value), 1);
  const width = 520;
  const height = 170;
  const paddingLeft = 20;
  const paddingTop = 20;
  const paddingBottom = 20;
  const plotWidth = width - 40;
  const plotHeight = height - 40;
  const step = trendSeries.length > 1 ? plotWidth / (trendSeries.length - 1) : plotWidth;
  const horizontalGridLines = 4;

  const yForValue = (value: number) => paddingTop + (1 - value / maxValue) * plotHeight;

  const points = trendSeries
    .map((point, index) => {
      const x = paddingLeft + index * step;
      const y = yForValue(point.value);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <Card className="gap-3 border-slate-200 py-4">
      <CardHeader className="px-4">
        <CardTitle className="text-sm font-semibold">Feedback Trend</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="w-full overflow-x-auto text-teal-700">
          <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
            {Array.from({ length: horizontalGridLines + 1 }).map((_, index) => {
              const y = paddingTop + (index / horizontalGridLines) * plotHeight;
              return (
                <line
                  key={`h-grid-${index}`}
                  x1={paddingLeft}
                  y1={y}
                  x2={paddingLeft + plotWidth}
                  y2={y}
                  stroke="#cbd5e1"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
              );
            })}
            {trendSeries.map((point, index) => {
              const x = paddingLeft + index * step;
              return (
                <line
                  key={`v-grid-${point.label}`}
                  x1={x}
                  y1={paddingTop}
                  x2={x}
                  y2={paddingTop + plotHeight}
                  stroke="#cbd5e1"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
              );
            })}
            <polyline fill="none" stroke="currentColor" strokeWidth={2} points={points} />
            {trendSeries.map((point, index) => {
              const x = paddingLeft + index * step;
              const y = yForValue(point.value);
              return (
                <g key={point.label}>
                  <circle cx={x} cy={y} r={3.5} fill="currentColor" />
                  <text x={x} y={height - paddingBottom / 2} textAnchor="middle" className="fill-slate-500 text-[10px]">
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
