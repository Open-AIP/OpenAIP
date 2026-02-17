import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DonutChartCard } from "@/features/dashboard/shared/components/charts";
import { formatPeso } from "@/lib/formatting";
import {
  DASHBOARD_BUDGET_SEGMENT_DOT_CLASS_BY_TEXT_CLASS,
  DASHBOARD_BUDGET_SEGMENT_HEX_BY_TEXT_CLASS,
  DASHBOARD_SEMANTIC_COLORS,
} from "@/lib/ui/tokens";
import { BudgetBreakdownVM } from "../types";


type BudgetDonutCardProps = {
  breakdown: BudgetBreakdownVM;
  aipDetailsHref?: string;
  onViewAipDetails?: () => void;
  onViewAllProjects?: () => void;
};

export default function BudgetDonutCard({
  breakdown,
  aipDetailsHref,
  onViewAipDetails,
  onViewAllProjects,
}: BudgetDonutCardProps) {
  return (
    <Card className="w-full gap-4 border-slate-200 py-4">
      <CardHeader className="px-4">
        <CardTitle className="text-sm font-semibold">Budget Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="flex items-center justify-center">
            <div className="w-full max-w-105">
              <DonutChartCard
                title="Budget Breakdown"
                series={{
                  data: breakdown.segments.map((item) => ({ name: item.label, value: item.value })),
                  innerRadius: 70,
                  outerRadius: 98,
                }}
                palette={breakdown.segments.map((item) => DASHBOARD_BUDGET_SEGMENT_HEX_BY_TEXT_CLASS[item.colorClass] ?? DASHBOARD_SEMANTIC_COLORS.neutral)}
                showLegend={false}
                height={280}
                className="gap-0 border-0 py-0 shadow-none [&_[data-slot=card-header]]:hidden [&_[data-slot=card-content]]:px-0"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <div className="text-xs text-slate-500">Total Budget</div>
              <div className="text-4xl font-semibold text-teal-800">{formatPeso(breakdown.totalBudget)}</div>
            </div>

            <div className="border-t border-slate-200 pt-4">
              <div className="space-y-3">
                {breakdown.segments.map((item) => (
                  <div key={item.label} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 text-sm text-slate-700">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${DASHBOARD_BUDGET_SEGMENT_DOT_CLASS_BY_TEXT_CLASS[item.colorClass] ?? "bg-slate-400"}`}
                      />
                      <span>{item.label}</span>
                    </div>
                    <div className="text-right text-slate-500">{item.percent}%</div>
                    <div className="text-right font-semibold text-slate-800">{formatPeso(item.value)}</div>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-xs italic text-slate-500">Categories derived from project classification.</p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-4">
          <div className="flex flex-wrap items-center gap-2">
            {onViewAipDetails ? (
              <Button className="bg-teal-700 text-white hover:bg-teal-800" type="button" onClick={onViewAipDetails}>
                View AIP Details
              </Button>
            ) : (
              <Button asChild className="bg-teal-700 text-white hover:bg-teal-800">
                <Link href={aipDetailsHref ?? "#"}>View AIP Details</Link>
              </Button>
            )}
            <Button variant="outline" type="button" onClick={onViewAllProjects}>
              View All Projects
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
