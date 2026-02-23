import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BudgetDonutCard } from "@/features/dashboard/components/budget-donut-card";

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
