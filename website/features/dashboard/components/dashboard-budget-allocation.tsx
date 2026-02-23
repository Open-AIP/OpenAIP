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
    <Card className="bg-white border border-gray-200 rounded-xl py-0 shadow-sm">
      <CardHeader className="border-b border-gray-200 px-5 py-4"><CardTitle className="text-sm font-medium text-slate-700">Budget Breakdown</CardTitle></CardHeader>
      <CardContent className="p-5 space-y-4">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.15fr]">
          <BudgetDonutCard items={items} />
          <div className="space-y-4">
            <div className="border-b border-gray-200 pb-4">
              <div className="text-sm text-slate-600">Total Budget</div>
              <div className="text-5xl font-semibold leading-none text-[#0B6477]">{totalBudget}</div>
            </div>
            <div className="space-y-2">
              {items.map((item) => (
                <div key={`summary-${item.sectorCode}`} className="grid grid-cols-[1fr_56px_120px] items-center gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: DONUT_COLORS[items.findIndex((row) => row.sectorCode === item.sectorCode) % DONUT_COLORS.length] }} />
                    <span className="text-slate-600">{item.label}</span>
                  </div>
                  <span className="text-right text-slate-500">{item.percentage.toFixed(0)}%</span>
                  <span className="text-right font-semibold text-slate-800">{item.amount.toLocaleString("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 })}</span>
                </div>
              ))}
            </div>
            <div className="text-xs text-slate-500">Categories derived from project classification.</div>
          </div>
        </div>
        <div className="border-t border-gray-200 pt-4 flex gap-3">
          <Button asChild className="bg-[#0B6477] text-white hover:bg-[#095565] rounded-lg"><Link href={detailsHref}>View AIP Details</Link></Button>
          <Button asChild variant="outline" className="border-gray-200"><Link href={detailsHref}>View All Projects</Link></Button>
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

  const calloutPositions = [
    "right-[-74px] top-[4px]",
    "left-[-86px] top-[78px]",
    "right-[-74px] bottom-[10px]",
    "right-[-72px] top-[122px]",
  ];

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="relative mx-auto h-56 w-56 rounded-full" style={{ background: donutBg }}>
        <div className="absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
        {items.slice(0, 4).map((item, index) => (
          <div key={`callout-${item.sectorCode}`} className={`absolute text-sm text-[#0B6477] ${calloutPositions[index]}`}>
            {item.label} {item.percentage.toFixed(0)}%
          </div>
        ))}
      </div>
    </div>
  );
}
