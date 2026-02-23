import { Card, CardContent } from "@/components/ui/card";

export function DateCard({ label }: { label: string }) {
  return (
    <Card className="border-slate-200 py-0 shadow-sm">
      <CardContent className="p-4">
        <div className="text-xs text-slate-500">Today</div>
        <div className="mt-2 text-xl font-semibold text-slate-900">{label}</div>
      </CardContent>
    </Card>
  );
}
