"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { UsageMetricsVM } from "@/lib/repos/admin-dashboard/types";
import { DASHBOARD_CHART_STROKES, DASHBOARD_SEMANTIC_COLORS } from "@/lib/ui/tokens";

export default function ChatbotUsageLineChart({ metrics }: { metrics: UsageMetricsVM }) {
  const data = metrics.chatbotUsageTrend;
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const chartHeight = 210;
  const svgWidth = Math.max(data.length * 80, 700);
  const plotWidth = svgWidth - 40;
  const gridLines = 4;
  const step = data.length > 1 ? plotWidth / (data.length - 1) : plotWidth;

  const points = data
    .map((point, idx) => {
      const x = idx * step;
      const y = chartHeight - (point.value / maxValue) * chartHeight;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <Card className="border-slate-200 py-0 shadow-none">
      <CardHeader className="space-y-1 pb-0">
        <CardTitle className="text-[18px]">Chatbot Usage Over Time</CardTitle>
        <div className="text-[12px] text-slate-500">
          Daily chatbot request volume showing usage trends and patterns.
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="w-full overflow-x-auto">
          <svg width="100%" height={250} viewBox={`0 0 ${svgWidth} 250`}>
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
                    stroke={DASHBOARD_CHART_STROKES.svgGrid}
                    strokeWidth={1}
                  />
                );
              })}
              <polyline
                fill="none"
                stroke={DASHBOARD_SEMANTIC_COLORS.cyan800}
                strokeWidth={2}
                points={points}
              />
              {data.map((point, idx) => {
                const x = idx * step;
                const y = chartHeight - (point.value / maxValue) * chartHeight;
                return (
                  <g key={point.label}>
                    <circle cx={x} cy={y} r={4} fill={DASHBOARD_SEMANTIC_COLORS.cyan800} />
                    <text
                      x={x}
                      y={chartHeight + 18}
                      textAnchor="middle"
                      className="text-[11px] fill-slate-400"
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
