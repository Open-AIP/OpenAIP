import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TrendPointVM } from "../types";

type FeedbackTrendCardProps = {
  trendSeries: TrendPointVM[];
};

export default function FeedbackTrendCard({ trendSeries }: FeedbackTrendCardProps) {
  const maxValue = Math.max(...trendSeries.map((point) => point.value), 1);
  const width = 520;
  const height = 170;
  const plotWidth = width - 40;
  const plotHeight = height - 40;
  const step = trendSeries.length > 1 ? plotWidth / (trendSeries.length - 1) : plotWidth;

  const points = trendSeries
    .map((point, index) => {
      const x = 20 + index * step;
      const y = 20 + (1 - point.value / maxValue) * plotHeight;
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
            <polyline fill="none" stroke="currentColor" strokeWidth={2} points={points} />
            {trendSeries.map((point, index) => {
              const x = 20 + index * step;
              const y = 20 + (1 - point.value / maxValue) * plotHeight;
              return (
                <g key={point.label}>
                  <circle cx={x} cy={y} r={3.5} fill="currentColor" />
                  <text x={x} y={height - 8} textAnchor="middle" className="fill-slate-500 text-[10px]">
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
