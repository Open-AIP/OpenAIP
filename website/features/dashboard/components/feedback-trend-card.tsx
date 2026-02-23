import { Card, CardContent } from "@/components/ui/card";

function tinyBarWidth(value: number, max: number): string {
  if (max <= 0) return "0%";
  return `${Math.max(8, Math.round((value / max) * 100))}%`;
}

export function FeedbackTrendCard({ points }: { points: Array<{ dayLabel: string; isoDate: string; count: number }> }) {
  const max = Math.max(1, ...points.map((row) => row.count));

  return (
    <Card className="border-slate-200 py-0 shadow-sm">
      <CardContent className="rounded-lg border border-slate-200 p-3">
        <div className="mb-2 text-sm font-medium text-slate-800">Feedback Trend (Last 7 Days)</div>
        <div className="grid grid-cols-7 gap-2">
          {points.map((point) => (
            <div key={point.isoDate} className="space-y-1 text-center">
              <div className="mx-auto h-20 w-5 rounded bg-slate-100">
                <div className="mt-auto h-full w-full rounded bg-[#0B6477]" style={{ height: tinyBarWidth(point.count, max) }} />
              </div>
              <div className="text-[10px] text-slate-500">{point.dayLabel}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
