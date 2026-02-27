import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const DONUT_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

export function BudgetBreakdownSection({
  totalBudget,
  items,
  detailsHref,
}: {
  totalBudget: string;
  items: Array<{ sectorCode: string; label: string; amount: number; percentage: number }>;
  detailsHref: string;
}) {
  const dotClassByIndex = ["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4", "bg-chart-5"];

  return (
    <Card className="bg-card text-card-foreground border border-border rounded-xl py-0">
      <CardHeader className="border-b border-border px-5 py-4"><CardTitle className="text-sm font-medium text-foreground">Budget Breakdown</CardTitle></CardHeader>
      <CardContent className="p-5 space-y-4">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.15fr]">
          <BudgetDonutCard items={items} />
          <div className="space-y-4">
            <div className="border-b border-border pb-4">
              <div className="text-sm text-muted-foreground">Total Budget</div>
              <div className="whitespace-nowrap tabular-nums truncate text-2xl font-semibold leading-none text-foreground">{totalBudget}</div>
            </div>
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={`summary-${item.sectorCode}`} className="grid grid-cols-[1fr_56px_120px] items-center gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${dotClassByIndex[index % dotClassByIndex.length]}`} />
                    <span className="text-sm text-foreground">{item.label}</span>
                  </div>
                  <span className="text-right text-sm text-muted-foreground">{item.percentage.toFixed(0)}%</span>
                  <span className="whitespace-nowrap truncate text-right text-sm font-semibold text-foreground">{item.amount.toLocaleString("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 })}</span>
                </div>
              ))}
            </div>
            <div className="text-xs italic text-muted-foreground">Categories derived from project classification.</div>
          </div>
        </div>
        <div className="border-t border-border pt-4 flex gap-3">
          <Button asChild className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"><Link href={detailsHref}>View AIP Details</Link></Button>
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
      <div className="relative mx-auto h-56 w-56 rounded-full overflow-hidden" style={{ background: donutBg }}>
        <div className="absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full bg-card" />
        {items.slice(0, 4).map((item, index) => (
          <div key={`callout-${item.sectorCode}`} className={`absolute text-sm text-muted-foreground ${calloutPositions[index]}`}>
            {item.label} {item.percentage.toFixed(0)}%
          </div>
        ))}
      </div>
    </div>
  );
}
