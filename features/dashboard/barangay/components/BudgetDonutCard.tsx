import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const dotColorByTextClass: Record<string, string> = {
    "text-blue-500": "bg-blue-500",
    "text-teal-700": "bg-teal-700",
    "text-emerald-500": "bg-emerald-500",
    "text-amber-500": "bg-amber-500",
  };

  const radius = 78;
  const strokeWidth = 26;
  const circumference = 2 * Math.PI * radius;
  const center = 140;

  const polarToCartesian = (angleDeg: number, distance: number) => {
    const rad = (angleDeg * Math.PI) / 180;
    return {
      x: center + Math.cos(rad) * distance,
      y: center + Math.sin(rad) * distance,
    };
  };

  const segments = breakdown.segments.map((item, index) => {
    const ratio = breakdown.totalBudget > 0 ? item.value / breakdown.totalBudget : 0;
    const length = ratio * circumference;
    const priorRatio = breakdown.segments
      .slice(0, index)
      .reduce(
        (sum, current) => sum + (breakdown.totalBudget > 0 ? current.value / breakdown.totalBudget : 0),
        0
      );
    const offset = priorRatio * circumference;
    const startAngle = priorRatio * 360 - 90;
    const midAngle = startAngle + ratio * 180;

    const p1 = polarToCartesian(midAngle, radius + strokeWidth / 2 + 2);
    const p2 = polarToCartesian(midAngle, radius + strokeWidth / 2 + 18);
    const labelToRight = p2.x >= center;
    const p3 = {
      x: p2.x + (labelToRight ? 16 : -16),
      y: p2.y,
    };

    return { ...item, ratio, length, offset, p1, p2, p3, labelToRight };
  });

  return (
    <Card className="w-full gap-4 border-slate-200 py-4">
      <CardHeader className="px-4">
        <CardTitle className="text-sm font-semibold">Budget Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="flex items-center justify-center">
            <div className="relative w-full max-w-105">
              <svg width="100%" height="280" viewBox="0 0 320 280" preserveAspectRatio="xMidYMid meet">
                <g transform="translate(140,140) rotate(-90)">
                  {segments.map((segment) => (
                    <g key={segment.label} className={segment.colorClass}>
                      <circle
                        r={radius}
                        cx={0}
                        cy={0}
                        fill="transparent"
                        stroke="currentColor"
                        strokeWidth={strokeWidth}
                        strokeDasharray={`${segment.length} ${circumference - segment.length}`}
                        strokeDashoffset={-segment.offset}
                        strokeLinecap="butt"
                      />
                    </g>
                  ))}
                </g>
                {segments.map((segment) => (
                  <g key={`${segment.label}-label`} className={segment.colorClass}>
                    <polyline
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.25"
                      points={`${segment.p1.x},${segment.p1.y} ${segment.p2.x},${segment.p2.y} ${segment.p3.x},${segment.p3.y}`}
                    />
                    <text
                      x={segment.p3.x + (segment.labelToRight ? 4 : -4)}
                      y={segment.p3.y + 4}
                      fontSize="10"
                      textAnchor={segment.labelToRight ? "start" : "end"}
                      fill="currentColor"
                    >
                      {segment.label} {Math.round(segment.ratio * 100)}%
                    </text>
                  </g>
                ))}
              </svg>
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
                        className={`h-2.5 w-2.5 rounded-full ${dotColorByTextClass[item.colorClass] ?? "bg-slate-400"}`}
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
            <Button asChild className="bg-teal-700 text-white hover:bg-teal-800" onClick={onViewAipDetails}>
              <Link href={aipDetailsHref}>View AIP Details</Link>
            </Button>
            <Button variant="outline" type="button" onClick={onViewAllProjects}>
              View All Projects
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
