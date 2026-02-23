import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function tinyBarWidth(value: number, max: number): string {
  if (max <= 0) return "0%";
  return `${Math.max(8, Math.round((value / max) * 100))}%`;
}

function formatStatusLabel(status: string): string {
  return status.replaceAll("_", " ").replace(/\b\w/g, (match) => match.toUpperCase());
}

export function AipStatusColumn({
  statusDistribution,
  pendingReviewAging,
}: {
  statusDistribution: Array<{ status: string; count: number }>;
  pendingReviewAging: Array<{ bucket: string; count: number }>;
}) {
  const maxAgingCount = Math.max(1, ...pendingReviewAging.map((bucket) => bucket.count));

  return (
    <div className="space-y-4">
      <Card className="border-slate-200 py-0 shadow-sm">
        <CardHeader className="pb-2"><CardTitle className="text-base">Status Distribution</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {statusDistribution.map((item) => (
            <div key={item.status} className="flex items-center justify-between rounded-md border border-slate-100 px-3 py-2">
              <span className="capitalize text-slate-600">{formatStatusLabel(item.status)}</span>
              <span className="font-medium text-slate-900">{item.count}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-slate-200 py-0 shadow-sm">
        <CardHeader className="pb-2"><CardTitle className="text-base">Pending Review Aging</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {pendingReviewAging.map((item) => (
            <div key={item.bucket} className="grid grid-cols-[56px_1fr_24px] items-center gap-2">
              <span className="text-slate-500">{item.bucket}</span>
              <div className="h-2.5 rounded-full bg-slate-100"><div className="h-2.5 rounded-full bg-[#0B6477]" style={{ width: tinyBarWidth(item.count, maxAgingCount) }} /></div>
              <span className="text-slate-700">{item.count}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
