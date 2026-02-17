"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { ChartCardPropsBase, DonutSeriesVM } from "./chartTypes";
import { DASHBOARD_CHART_PALETTE } from "@/lib/ui/tokens";

type DonutChartCardProps = ChartCardPropsBase & {
  series: DonutSeriesVM;
  height?: number;
  palette?: string[];
  showLegend?: boolean;
  valueFormatter?: (value: number) => string;
  centerLabel?: { title: string; value: string };
};

const DEFAULT_PALETTE = DASHBOARD_CHART_PALETTE;

export function DonutChartCard({
  title,
  subtitle,
  helperText,
  className,
  loading,
  emptyText,
  actionSlot,
  series,
  height = 260,
  palette,
  showLegend = true,
  valueFormatter,
  centerLabel,
}: DonutChartCardProps) {
  const chartPalette = palette && palette.length > 0 ? palette : DEFAULT_PALETTE;
  const hasData = series.data.length > 0;

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
          <div className="relative" style={{ height }} aria-label={`${title} chart`} role="img">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={series.data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={series.innerRadius ?? 62}
                  outerRadius={series.outerRadius ?? 92}
                  paddingAngle={1}
                  stroke="none"
                >
                  {series.data.map((entry, index) => (
                    <Cell key={`${entry.name}-${index}`} fill={chartPalette[index % chartPalette.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => valueFormatter?.(Number(value)) ?? Number(value)} />
                {showLegend ? <Legend /> : null}
              </PieChart>
            </ResponsiveContainer>

            {centerLabel ? (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                <p className="text-xs text-slate-500">{centerLabel.title}</p>
                <p className="text-xl font-semibold text-slate-900">{centerLabel.value}</p>
              </div>
            ) : null}
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

export default DonutChartCard;

// Usage VM example: { data: [{ name: "Draft", value: 12 }, { name: "Published", value: 5 }] }
