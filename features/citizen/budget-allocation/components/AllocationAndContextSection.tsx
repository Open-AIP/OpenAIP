import { ArrowDownRight, ArrowUpRight, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChartCard } from "@/features/dashboard/shared/components/charts";
import { formatPeso } from "@/lib/formatting";
import type { AllocationChartVM, SelectedContextVM } from "@/lib/types/viewmodels/citizen-budget-allocation.vm";
import { formatCompactPeso, formatPercent } from "../utils";

type AllocationAndContextSectionProps = {
  chart: AllocationChartVM;
  selectedContext: SelectedContextVM;
};

export default function AllocationAndContextSection({ chart, selectedContext }: AllocationAndContextSectionProps) {
  const trendUp = (selectedContext.yoyAbs ?? 0) >= 0;

  return (
    <section className="grid gap-4 lg:grid-cols-[62%_38%]">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm text-slate-800">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-slate-100 text-[#0f5d8e]">
              <TrendingUp className="h-4 w-4" />
            </span>
            Allocation by Service Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BarChartCard
            title="Allocation by Service Category"
            className="border-0 py-0 shadow-none [&_[data-slot=card-header]]:hidden [&_[data-slot=card-content]]:px-0"
            series={{
              data: chart.labels.map((label, index) => ({
                category: label,
                value: chart.values[index] ?? 0,
              })),
              xKey: "category",
              bars: [{ key: "value", label: "Budget", fill: "#0f5d8e" }],
            }}
            showLegend={false}
            showGrid
            height={260}
            emptyText="No category allocation yet."
            formatTooltipValue={(value) => formatPeso(Number(value))}
          />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {chart.legend.map((item) => (
              <div key={item.label} className="inline-flex items-center gap-2 text-xs text-slate-600">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                {item.label}: {formatCompactPeso(item.value)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-gradient-to-br from-[#0b3d63] via-[#0a4b72] to-[#0b5c7a] text-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm">Selected Context</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs text-white/70">Viewing</p>
            <p className="text-sm font-semibold">All Categories</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-white/70">Total Allocation</p>
            <p className="text-2xl font-semibold" title={formatPeso(selectedContext.totalAllocation)}>
              {formatCompactPeso(selectedContext.totalAllocation)}
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-white/70">Projects</p>
            <p className="text-2xl font-semibold">{selectedContext.totalProjects.toLocaleString("en-PH")}</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-white/70">Budget Increase</p>
              {trendUp ? (
                <ArrowUpRight className="h-4 w-4 text-emerald-300" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-amber-300" />
              )}
            </div>
            <p className="text-xl font-semibold">
              {selectedContext.hasPriorYear ? formatPercent(selectedContext.yoyPct) : "N/A"}
            </p>
            <p className="text-xs text-white/60">
              {selectedContext.hasPriorYear
                ? `From prior fiscal year`
                : "No published prior-year AIP"}
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
