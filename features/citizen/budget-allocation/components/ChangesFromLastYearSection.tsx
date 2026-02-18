import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { CategoryChangeVM, ChangesFromLastYearVM } from "@/lib/types/viewmodels/citizen-budget-allocation.vm";
import { formatCompactPeso, formatPercent, trendBadgeClass } from "../utils";

const resolveTrendIcon = (trend: CategoryChangeVM["trend"]) => {
  if (trend === "up") return <ArrowUpRight className="h-3.5 w-3.5" />;
  if (trend === "down") return <ArrowDownRight className="h-3.5 w-3.5" />;
  return <Minus className="h-3.5 w-3.5" />;
};

const valueRatio = (value: number, max: number) => {
  if (max <= 0) return 0;
  return Math.max(8, Math.round((value / max) * 100));
};

type ChangesFromLastYearSectionProps = {
  vm: ChangesFromLastYearVM;
  currentYear: number;
};

export default function ChangesFromLastYearSection({ vm, currentYear }: ChangesFromLastYearSectionProps) {
  const { summary, categories } = vm;
  const deltaLabel = summary.totalDeltaAbs === null ? "N/A" : `${summary.totalDeltaAbs >= 0 ? "+" : "-"}${formatCompactPeso(Math.abs(summary.totalDeltaAbs))}`;
  const deltaPctLabel = summary.totalDeltaPct === null ? "N/A" : `(${formatPercent(summary.totalDeltaPct)})`;
  const priorYearLabel = currentYear - 1;

  return (
    <section className="space-y-4">
      <div className="text-center">
        <h2 className="text-3xl font-semibold text-[#0b5188]">Changes from Last Fiscal Year ({priorYearLabel})</h2>
        <p className="text-xs text-slate-500">Shown only when a published prior-year AIP exists for the selected LGU.</p>
      </div>

      <Card className="border-slate-200 bg-gradient-to-br from-[#0b3d63] via-[#0a4b72] to-[#0b5c7a] text-white shadow-sm">
        <CardContent className="space-y-2 p-6">
          <p className="text-xs text-white/70">Total Budget Change (All Categories)</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-semibold">{deltaLabel}</p>
            <p className="text-sm text-white/70">{deltaPctLabel}</p>
          </div>
          <p className="text-xs text-white/60">
            FY {priorYearLabel}: {summary.priorFYTotal === null ? "N/A" : formatCompactPeso(summary.priorFYTotal)}
            {" | "}
            FY {currentYear}: {formatCompactPeso(summary.currentFYTotal)}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {categories.map((category) => {
          const max = Math.max(category.currentTotal, category.priorTotal ?? 0);
          const currentWidth = valueRatio(category.currentTotal, max);
          const priorWidth = valueRatio(category.priorTotal ?? 0, max);
          return (
            <Card key={category.categoryKey} className="border-slate-200 shadow-sm">
              <CardContent className="space-y-4 p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">{category.label}</p>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${trendBadgeClass(category.trend)}`}>
                    {resolveTrendIcon(category.trend)}
                    {category.deltaPct === null ? "N/A" : formatPercent(category.deltaPct)}
                  </span>
                </div>
                <div>
                  <p className="text-xl font-semibold text-slate-900">
                    {category.deltaAbs === null
                      ? "N/A"
                      : `${category.deltaAbs >= 0 ? "+" : "-"}${formatCompactPeso(Math.abs(category.deltaAbs))}`}
                  </p>
                  <p className="text-xs text-slate-500">Change vs FY {priorYearLabel}</p>
                </div>
                <div className="space-y-2 text-[11px] text-slate-500">
                  <div className="flex items-center justify-between">
                    <span>FY {priorYearLabel}</span>
                    <span>{category.priorTotal === null ? "N/A" : formatCompactPeso(category.priorTotal)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-slate-300" style={{ width: `${priorWidth}%` }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>FY {currentYear}</span>
                    <span>{formatCompactPeso(category.currentTotal)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-[#0b5188]" style={{ width: `${currentWidth}%` }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
