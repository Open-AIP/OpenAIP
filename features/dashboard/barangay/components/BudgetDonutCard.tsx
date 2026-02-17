import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatPeso } from "@/lib/formatting";
import type { BudgetBreakdownVM } from "../types";

type BudgetDonutCardProps = {
  breakdown: BudgetBreakdownVM;
  aipDetailsHref: string;
  onViewAipDetails?: () => void;
  onViewAllProjects?: () => void;
};

export default function BudgetDonutCard({
  breakdown,
  aipDetailsHref,
  onViewAipDetails,
  onViewAllProjects,
}: BudgetDonutCardProps) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;

  const segments = breakdown.segments.map((item, index) => {
    const ratio = breakdown.totalBudget > 0 ? item.value / breakdown.totalBudget : 0;
    const length = ratio * circumference;
    const offset = breakdown.segments
      .slice(0, index)
      .reduce(
        (sum, current) => sum + (breakdown.totalBudget > 0 ? (current.value / breakdown.totalBudget) * circumference : 0),
        0
      );

    return { ...item, ratio, length, offset };
  });

  return (
    <Card className="gap-4 border-slate-200 py-4">
      <CardHeader className="px-4">
        <CardTitle className="text-sm font-semibold">Budget Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-4">
        <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
          <div className="space-y-3">
            <div className="relative flex h-52 w-52 items-center justify-center">
              <svg width="208" height="208" viewBox="0 0 208 208">
                <g transform="translate(104,104) rotate(-90)">
                  {segments.map((segment) => (
                    <g key={segment.label} className={segment.colorClass}>
                      <circle
                        r={radius}
                        cx={0}
                        cy={0}
                        fill="transparent"
                        stroke="currentColor"
                        strokeWidth={24}
                        strokeDasharray={`${segment.length} ${circumference - segment.length}`}
                        strokeDashoffset={-segment.offset}
                      />
                    </g>
                  ))}
                </g>
              </svg>
              <div className="absolute text-center">
                <div className="text-[11px] text-slate-500">Total Budget</div>
                <div className="text-2xl font-semibold text-slate-900">{formatPeso(breakdown.totalBudget)}</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
              {segments.map((segment) => (
                <div key={segment.label} className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${segment.colorClass.replace("text", "bg")}`} />
                  <span>{segment.label}</span>
                  <span className="font-semibold">{Math.round(segment.ratio * 100)}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <div className="text-xs text-slate-500">Total Budget</div>
              <div className="text-4xl font-semibold text-teal-800">{formatPeso(breakdown.totalBudget)}</div>
            </div>

            <div className="rounded-lg border border-slate-200">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">%</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {breakdown.segments.map((item) => (
                    <TableRow key={item.label}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${item.colorClass.replace("text", "bg")}`} />
                          <span>{item.label}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{item.percent}%</TableCell>
                      <TableCell className="text-right">{formatPeso(item.value)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button asChild className="bg-teal-700 text-white hover:bg-teal-800" onClick={onViewAipDetails}>
                <Link href={aipDetailsHref}>View AIP Details</Link>
              </Button>
              <Button variant="outline" type="button" onClick={onViewAllProjects}>
                View All Projects
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
