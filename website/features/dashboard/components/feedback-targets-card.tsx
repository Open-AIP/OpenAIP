import { Card, CardContent } from "@/components/ui/card";

function tinyBarWidth(value: number, max: number): string {
  if (max <= 0) return "0%";
  return `${Math.max(8, Math.round((value / max) * 100))}%`;
}

export function FeedbackTargetsCard({ targets }: { targets: Array<{ label: string; value: number }> }) {
  const max = Math.max(1, ...targets.map((target) => target.value));
  return (
    <Card className="border-slate-200 py-0 shadow-sm">
      <CardContent className="rounded-lg border border-slate-200 p-3">
        <div className="mb-2 text-sm font-medium text-slate-800">Feedback Targets</div>
        <div className="space-y-2">
          {targets.map((target) => (
            <div key={target.label} className="grid grid-cols-[120px_1fr_28px] items-center gap-2 text-sm">
              <span className="text-slate-600">{target.label}</span>
              <div className="h-2.5 rounded-full bg-slate-100"><div className="h-2.5 rounded-full bg-blue-500" style={{ width: tinyBarWidth(target.value, max) }} /></div>
              <span className="text-slate-700">{target.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
