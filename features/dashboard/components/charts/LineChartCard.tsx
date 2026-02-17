"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { ChartCardPropsBase, LineSeriesVM } from "./chartTypes";

type LineChartCardProps = ChartCardPropsBase & {
  series: LineSeriesVM;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  palette?: string[];
  formatXAxis?: (value: unknown) => string;
  formatTooltipValue?: (value: unknown, name: string) => string | number;
  formatYAxis?: (value: unknown) => string;
};

const DEFAULT_PALETTE = ["#0f766e", "#2563eb", "#10b981", "#f59e0b", "#7c3aed"];

export function LineChartCard({
  title,
  subtitle,
  helperText,
  className,
  loading,
  emptyText,
  actionSlot,
  series,
  height = 260,
  showGrid = true,
  showLegend = true,
  palette,
  formatXAxis,
  formatTooltipValue,
  formatYAxis,
}: LineChartCardProps) {
  const chartPalette = palette && palette.length > 0 ? palette : DEFAULT_PALETTE;
  const hasData = series.data.length > 0 && series.lines.length > 0;

  return (
    <Card className={`border-slate-200 py-4 ${className ?? ""}`}>
      <CardHeader className="px-4">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        {subtitle ? <CardDescription>{subtitle}</CardDescription> : null}
        {actionSlot ? <CardAction>{actionSlot}</CardAction> : null}
      </CardHeader>

      <CardContent className="px-4">
        {loading ? (
          <div className="animate-pulse rounded-md bg-slate-100" style={{ height }} aria-label={`${title} loading`} />
        ) : hasData ? (
          <div style={{ height }} aria-label={`${title} chart`} role="img">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series.data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                {showGrid ? <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" /> : null}
                <XAxis
                  dataKey={series.xKey}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={formatXAxis}
                  stroke="#64748b"
                  fontSize={12}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={formatYAxis}
                  stroke="#64748b"
                  fontSize={12}
                />
                <Tooltip
                  formatter={
                    formatTooltipValue
                      ? (value, name) => formatTooltipValue(value, typeof name === "string" ? name : "")
                      : undefined
                  }
                />
                {showLegend ? <Legend /> : null}
                {series.lines.map((line, index) => (
                  <Line
                    key={line.key}
                    dataKey={line.key}
                    name={line.label}
                    type="monotone"
                    stroke={line.stroke ?? chartPalette[index % chartPalette.length]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div
            className="flex items-center justify-center rounded-md border border-dashed border-slate-300 text-sm text-slate-500"
            style={{ height }}
            aria-label={`${title} empty state`}
          >
            {emptyText ?? "No chart data available."}
          </div>
        )}
      </CardContent>

      {helperText ? (
        <CardFooter className="px-4 text-xs text-slate-500">
          <p>{helperText}</p>
        </CardFooter>
      ) : null}
    </Card>
  );
}

export default LineChartCard;

// Usage VM example: { data: [{ day: "Mon", count: 10 }], xKey: "day", lines: [{ key: "count", label: "Requests" }] }
