import Link from "next/link";
import { ArrowRight, Landmark } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChartCard } from "@/features/dashboard/shared/components/charts";
import { formatPeso } from "@/lib/formatting";
import type { CitizenDashboardCategoryAllocationVM } from "@/lib/types/viewmodels/dashboard";
import { categoryCardClasses, categoryChartColor } from "../utils";

type BudgetBreakdownSectionProps = {
  scopeLabel: string;
  fiscalYear: number;
  totalBudget: number;
  categoryRows: { label: string; amount: number; percent: number; sectorCode: string }[];
  categoryAllocation: CitizenDashboardCategoryAllocationVM[];
  projectQueryString: string;
};

export default function BudgetBreakdownSection({
  scopeLabel,
  fiscalYear,
  totalBudget,
  categoryRows,
  categoryAllocation,
  projectQueryString,
}: BudgetBreakdownSectionProps) {
  return (
    <section className="space-y-6 px-2 md:px-6">
      <div className="space-y-2 text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-[#0b5188] md:text-5xl">
          {scopeLabel} Budget Allocation Breakdown (FY {fiscalYear})
        </h2>
        <p className="text-base text-slate-500">Total budget and allocation by category for FY {fiscalYear}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[40%_60%]">
        <Card className="overflow-hidden border-0 bg-gradient-to-b from-[#0f5d8e] to-[#0a3f63] text-white shadow-xl">
          <CardContent className="space-y-5 p-6">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-xl font-semibold">$</div>
            <div>
              <p className="text-sm text-slate-100">Total Budget (FY {fiscalYear})</p>
              <p className="mt-2 text-5xl font-semibold">{formatPeso(totalBudget)}</p>
              <p className="mt-2 text-sm text-slate-100">From the published AIP record</p>
            </div>
            <Button asChild className="w-full rounded-xl bg-white text-[#0b5087] hover:bg-slate-100">
              <Link href="/budget-allocation">View Full Budget Allocation</Link>
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          {categoryRows.map((item) => {
            const baseParams = new URLSearchParams(projectQueryString);
            if (item.sectorCode) baseParams.set("sector_code", item.sectorCode);
            const projectHref = baseParams.toString() ? `/projects?${baseParams.toString()}` : "/projects";
            const baseHref = projectQueryString ? `/projects?${projectQueryString}` : "/projects";
            return (
              <Card key={item.label} className={`border shadow-sm ${categoryCardClasses(item.label)}`}>
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{item.label}</p>
                    <Badge variant="outline" className="rounded-full border-none bg-white/75 text-xs">
                      {item.percent.toFixed(1)}%
                    </Badge>
                  </div>
                  <p className="text-4xl font-semibold">{formatPeso(item.amount)}</p>
                  <Button
                    asChild
                    variant="ghost"
                    className="h-8 px-0 text-xs font-medium text-inherit hover:bg-transparent hover:underline"
                    disabled={!item.sectorCode}
                  >
                    <Link href={item.sectorCode ? projectHref : baseHref}>
                      View Projects <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Card className="border-slate-200 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl text-slate-800">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-slate-100 text-[#0f5d8e]">
              <Landmark className="h-4 w-4" />
            </span>
            Allocation by Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BarChartCard
            title="Allocation by Category"
            className="border-0 py-0 shadow-none [&_[data-slot=card-header]]:hidden [&_[data-slot=card-content]]:px-0"
            series={{
              data: categoryAllocation.map((item) => ({
                sector: item.sectorLabel.replace(" Services", ""),
                amount: item.amount,
                color: categoryChartColor(item.sectorLabel),
              })),
              xKey: "sector",
              bars: [{ key: "amount", label: "Budget", fillKey: "color" }],
            }}
            showLegend={false}
            showGrid
            height={290}
            emptyText="No category allocation yet."
            formatTooltipValue={(value) => formatPeso(Number(value))}
            formatYAxis={(value) => formatPeso(Number(value))}
          />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {categoryRows.map((item) => (
              <div key={item.label} className="inline-flex items-center gap-2 text-xs text-slate-600">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: categoryChartColor(item.label) }} />
                {item.label}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
