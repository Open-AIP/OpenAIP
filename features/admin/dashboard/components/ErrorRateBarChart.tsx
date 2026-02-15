"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { UsageMetricsVM } from "@/lib/repos/admin-dashboard/types";

export default function ErrorRateBarChart({ metrics }: { metrics: UsageMetricsVM }) {
  const data = metrics.errorRateTrend;
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const chartHeight = 160;
  const barWidth = 16;
  const gap = 10;
  const width = data.length * (barWidth + gap);
  const svgWidth = Math.max(width, 420);
  const plotWidth = svgWidth - 40;
  const gridLines = 4;

  return (
    <Card className="border-slate-200">
      <CardHeader className="space-y-1">
        <CardTitle className="text-[15px]">Error Rate Trend</CardTitle>
        <div className="text-[12px] text-slate-500">
          Daily error rate percentage showing system reliability and performance issues.
        </div>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-x-auto">
          <svg
            width="100%"
            height={220}
            viewBox={`0 0 ${svgWidth} 220`}
            className="text-slate-400"
          >
            <g transform="translate(20,20)">
              {Array.from({ length: gridLines + 1 }, (_, idx) => {
                const y = (chartHeight / gridLines) * idx;
                return (
                  <line
                    key={`grid-${idx}`}
                    x1={0}
                    y1={y}
                    x2={plotWidth}
                    y2={y}
                    stroke="#e2e8f0"
                    strokeWidth={1}
                  />
                );
              })}
              {data.map((point, idx) => {
                const barHeight = (point.value / maxValue) * chartHeight;
                const x = idx * (barWidth + gap);
                return (
                  <g key={point.label}>
                    <rect
                      x={x}
                      y={chartHeight - barHeight}
                      width={barWidth}
                      height={barHeight}
                      rx={4}
                      fill="#ef4444"
                    />
                    <text
                      x={x + barWidth / 2}
                      y={chartHeight + 18}
                      textAnchor="middle"
                      className="text-[10px] fill-slate-400"
                    >
                      {point.label}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>
      </CardContent>
    </Card>
  );
}
