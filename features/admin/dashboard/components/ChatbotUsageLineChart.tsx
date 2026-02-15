"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { UsageMetricsVM } from "@/lib/repos/admin-dashboard/types";

export default function ChatbotUsageLineChart({ metrics }: { metrics: UsageMetricsVM }) {
  const data = metrics.chatbotUsageTrend;
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const chartHeight = 160;
  const chartWidth = data.length * 30;
  const svgWidth = Math.max(chartWidth, 420);
  const plotWidth = svgWidth - 40;
  const gridLines = 4;

  const points = data
    .map((point, idx) => {
      const x = idx * 30;
      const y = chartHeight - (point.value / maxValue) * chartHeight;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <Card className="border-slate-200">
      <CardHeader className="space-y-1">
        <CardTitle className="text-[15px]">Chatbot Usage Over Time</CardTitle>
        <div className="text-[12px] text-slate-500">
          Daily chatbot request volume showing usage trends and patterns.
        </div>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-x-auto">
          <svg width="100%" height={220} viewBox={`0 0 ${svgWidth} 220`}>
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
              <polyline
                fill="none"
                stroke="#0E5D6F"
                strokeWidth={2}
                points={points}
              />
              {data.map((point, idx) => {
                const x = idx * 30;
                const y = chartHeight - (point.value / maxValue) * chartHeight;
                return (
                  <g key={point.label}>
                    <circle cx={x} cy={y} r={3} fill="#0E5D6F" />
                    <text
                      x={x}
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
