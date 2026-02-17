"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { ChartCardPropsBase, DonutSeriesVM } from "./chartTypes";

type PieChartCardProps = ChartCardPropsBase & {
  series: DonutSeriesVM;
  height?: number;
  palette?: string[];
  showLabels?: boolean;
  valueFormatter?: (value: number) => string;
  centerLabel?: { title: string; value: string };
};

const DEFAULT_PALETTE = ["#0f766e", "#2563eb", "#10b981", "#f59e0b", "#7c3aed"];

const renderLabel =
  (data: Array<{ name: string; value: number }>) =>
  ({ name, percent, x, y, index }: { name?: string; percent?: number; x?: number; y?: number; index?: number }) => {
    if (typeof x !== "number" || typeof y !== "number") return null;

    const total = data.reduce((sum, item) => sum + item.value, 0);
    const fallbackPercent = total > 0 && typeof index === "number" && data[index]
      ? Math.round((data[index].value / total) * 100)
      : 0;
    const displayPercent = percent ? Math.round(percent * 100) : fallbackPercent;

    return (
      <text x={x} y={y} textAnchor="middle" className="fill-current text-[11px] font-medium">
        {`${name ?? ""}: ${displayPercent}%`}
      </text>
    );
  };

export function PieChartCard({
  title,
  subtitle,
  helperText,
  className,
  loading,
  emptyText,
  actionSlot,
  series,
  height = 230,
  palette,
  showLabels = true,
  valueFormatter,
  centerLabel,
}: PieChartCardProps) {
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
                  innerRadius={0}
                  outerRadius={series.outerRadius ?? 82}
                  paddingAngle={1}
                  stroke="none"
                  label={showLabels ? renderLabel(series.data) : false}
                  labelLine={showLabels}
                >
                  {series.data.map((entry, index) => (
                    <Cell key={`${entry.name}-${index}`} fill={chartPalette[index % chartPalette.length]} className="text-slate-700" />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => valueFormatter?.(Number(value)) ?? Number(value)} />
              </PieChart>
            </ResponsiveContainer>

            {centerLabel ? (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                <p className="text-xs text-slate-500">{centerLabel.title}</p>
                <p className="text-2xl font-semibold text-slate-900">{centerLabel.value}</p>
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

export default PieChartCard;

// Usage VM example: { data: [{ name: "Draft", value: 12 }, { name: "Published", value: 5 }] }
