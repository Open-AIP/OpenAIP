import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const DONUT_COLORS = ["#0B6477", "#3B82F6", "#10B981", "#F59E0B", "#64748B"];

export function BudgetBreakdownSection({
  totalBudget,
  items,
  detailsHref,
}: {
  totalBudget: string;
  items: Array<{ sectorCode: string; label: string; amount: number; percentage: number }>;
  detailsHref: string;
}) {
  return (
    <Card className="border-slate-200 py-0 shadow-sm">
      <CardHeader className="pb-3"><CardTitle className="text-lg">Budget Breakdown</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <BudgetDonutCard items={items} />
        <div>
          <div className="text-xs text-slate-500">Total Budget</div>
          <div className="text-4xl font-semibold text-[#0B6477]">{totalBudget}</div>
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          <Button asChild className="bg-[#0B6477] hover:bg-[#095565]"><Link href={detailsHref}>View AIP Details</Link></Button>
          <Button asChild variant="outline"><Link href={detailsHref}>View All Projects</Link></Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function BudgetDonutCard({
  items,
}: {
  items: Array<{ sectorCode: string; label: string; amount: number; percentage: number }>;
}) {
  const donutStops = items.reduce(
    (acc, item, index) => {
      const start = acc.cursor;
      const end = start + item.percentage;
      const color = DONUT_COLORS[index % DONUT_COLORS.length];
      acc.parts.push(`${color} ${start}% ${end}%`);
      acc.cursor = end;
      return acc;
    },
    { parts: [] as string[], cursor: 0 }
  );
  const donutBg =
    donutStops.parts.length > 0 ? `conic-gradient(${donutStops.parts.join(", ")})` : "conic-gradient(#e2e8f0 0 100%)";

  return (
    <div className="grid gap-4 md:grid-cols-[260px_1fr]">
      <div className="mx-auto h-56 w-56 rounded-full" style={{ background: donutBg }}>
        <div className="mx-auto mt-7 h-42 w-42 rounded-full bg-white" />
      </div>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={item.sectorCode} className="grid grid-cols-[16px_1fr_auto_auto] items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: DONUT_COLORS[index % DONUT_COLORS.length] }} />
            <span>{item.label}</span>
            <span className="text-slate-500">{item.percentage.toFixed(0)}%</span>
            <span className="font-medium text-slate-900">{item.amount.toLocaleString("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 })}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
