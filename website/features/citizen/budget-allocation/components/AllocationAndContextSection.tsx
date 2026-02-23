import { ArrowDownRight, ArrowUpRight, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatPeso } from "@/lib/formatting";
import type { AllocationChartVM, BudgetCategoryKey, SelectedContextVM, ChartLegendItem } from "@/lib/domain/citizen-budget-allocation";
import { formatCompactPeso, formatPercent } from "../utils";

type CategoryOption = {
  key: "all" | BudgetCategoryKey;
  label: string;
};

type AllocationAndContextSectionProps = {
  chart: AllocationChartVM;
  selectedContext: SelectedContextVM;
  categoryOptions: CategoryOption[];
  selectedCategory: CategoryOption["key"];
  onCategoryChange: (value: CategoryOption["key"]) => void;
};

export default function AllocationAndContextSection({
  chart,
  selectedContext,
  categoryOptions,
  selectedCategory,
  onCategoryChange,
}: AllocationAndContextSectionProps) {
  const trendUp = (selectedContext.yoyAbs ?? 0) >= 0;
  const colorByLabel = new Map(chart.legend.map((item: ChartLegendItem) => [item.label.toLowerCase(), item.color]));
  const selectedLabel =
    categoryOptions.find((option) => option.key === selectedCategory)?.label ?? "All Categories";

  const chartData = chart.labels.map((label: string, index: number) => ({
    category: label,
    value: chart.values[index] ?? 0,
    color: colorByLabel.get(label.toLowerCase()) ?? "#0f5d8e",
  }));

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
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="category" tick={{ fontSize: 12, fill: "#64748b" }} />
                <YAxis tick={{ fontSize: 12, fill: "#64748b" }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}
                  formatter={(value: number | undefined) => {
                    if (value === undefined) return "";
                    return formatPeso(value);
                  }}
                />
                <Bar dataKey="value" fill="#0f5d8e" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {chart.legend.map((item: ChartLegendItem) => (
              <div key={item.label} className="inline-flex items-center gap-2 text-xs text-slate-600">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                {item.label}: {formatCompactPeso(item.value)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-linear-to-br from-[#0b3d63] via-[#0a4b72] to-[#0b5c7a] text-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm">Selected Context</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs text-white/70">Viewing</p>
            <Select value={selectedCategory} onValueChange={(value: string) => onCategoryChange(value as CategoryOption["key"])}>
              <SelectTrigger className="mt-2 h-9 w-fit rounded-full border border-white/30 bg-white/10 px-3 text-xs font-semibold text-white">
                <SelectValue placeholder={selectedLabel} />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((option: CategoryOption) => (
                  <SelectItem key={option.key} value={option.key}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              {selectedContext.hasPriorYear ? formatPercent(selectedContext.yoyPct ?? 0) : "N/A"}
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
