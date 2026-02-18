"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { BarSeriesVM, ChartCardPropsBase } from "./chartTypes";
import {
  DASHBOARD_CHART_PALETTE,
  DASHBOARD_CHART_STROKES,
} from "@/lib/ui/tokens";

type BarChartCardProps = ChartCardPropsBase & {
  series: BarSeriesVM;
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  palette?: string[];
  formatTooltipValue?: (value: unknown, name: string) => string | number;
  formatYAxis?: (value: unknown) => string;
};

const DEFAULT_PALETTE = DASHBOARD_CHART_PALETTE;

export function BarChartCard({
  title,
  subtitle,
  helperText,
  className,
  loading,
  emptyText,
  actionSlot,
  series,
  height = 260,
  showLegend = true,
  showGrid = true,
  palette,
  formatTooltipValue,
  formatYAxis,
}: BarChartCardProps) {
  const chartPalette = palette && palette.length > 0 ? palette : DEFAULT_PALETTE;
  const hasData = series.data.length > 0 && series.bars.length > 0;

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
              <BarChart data={series.data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                {showGrid ? <CartesianGrid strokeDasharray="3 3" stroke={DASHBOARD_CHART_STROKES.grid} /> : null}
                <XAxis dataKey={series.xKey} tickLine={false} axisLine={false} tickMargin={8} stroke={DASHBOARD_CHART_STROKES.axis} fontSize={12} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={formatYAxis}
                  stroke={DASHBOARD_CHART_STROKES.axis}
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
                {series.bars.map((bar, index) => {
                  const fillKey = bar.fillKey;
                  return (
                    <Bar
                      key={bar.key}
                      dataKey={bar.key}
                      name={bar.label}
                      fill={bar.fill ?? chartPalette[index % chartPalette.length]}
                      stackId={bar.stackId}
                      radius={[6, 6, 0, 0]}
                    >
                      {fillKey
                        ? series.data.map((entry, cellIndex) => {
                            const value = entry[fillKey];
                            const cellFill = typeof value === "string" && value ? value : undefined;
                            return <Cell key={`${bar.key}-${cellIndex}`} fill={cellFill} />;
                          })
                        : null}
                    </Bar>
                  );
                })}
              </BarChart>
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

export default BarChartCard;

// Usage VM example: { data: [{ bucket: "0-3 days", items: 5 }], xKey: "bucket", bars: [{ key: "items", label: "Items" }] }
