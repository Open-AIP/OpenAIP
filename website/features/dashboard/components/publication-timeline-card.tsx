import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function tinyBarWidth(value: number, max: number): string {
  if (max <= 0) return "0%";
  return `${Math.max(8, Math.round((value / max) * 100))}%`;
}

export function PublicationTimelineCard({ years }: { years: Array<{ year: number; count: number }> }) {
  const max = Math.max(1, ...years.map((item) => item.count));
  return (
    <Card className="border-slate-200 py-0 shadow-sm">
      <CardHeader><CardTitle className="text-base">Publication Timeline</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {years.map((item) => (
          <div key={item.year} className="grid grid-cols-[56px_1fr_24px] items-center gap-2 text-sm">
            <span className="text-slate-600">{item.year}</span>
            <div className="h-2.5 rounded-full bg-slate-100"><div className="h-2.5 rounded-full bg-emerald-500" style={{ width: tinyBarWidth(item.count, max) }} /></div>
            <span className="text-slate-700">{item.count}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
