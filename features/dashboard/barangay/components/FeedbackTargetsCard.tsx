import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TargetPointVM } from "../types";

type FeedbackTargetsCardProps = {
  targetsSeries: TargetPointVM[];
};

export default function FeedbackTargetsCard({ targetsSeries }: FeedbackTargetsCardProps) {
  const maxValue = Math.max(...targetsSeries.map((point) => point.count), 1);
  const width = 520;
  const height = 190;
  const chartHeight = 130;
  const barSpace = width / Math.max(targetsSeries.length, 1);
  const barWidth = Math.min(90, barSpace * 0.55);

  return (
    <Card className="gap-3 border-slate-200 py-4">
      <CardHeader className="px-4">
        <CardTitle className="text-sm font-semibold">Feedback Targets</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="w-full overflow-x-auto text-blue-500">
          <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
            {targetsSeries.map((point, index) => {
              const barHeight = (point.count / maxValue) * chartHeight;
              const x = index * barSpace + (barSpace - barWidth) / 2;
              const y = 20 + (chartHeight - barHeight);

              return (
                <g key={point.label}>
                  <rect x={x} y={y} width={barWidth} height={barHeight} rx={6} fill="currentColor" />
                  <text x={x + barWidth / 2} y={height - 32} textAnchor="middle" className="fill-slate-500 text-[10px]">
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
