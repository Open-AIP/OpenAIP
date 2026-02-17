import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { WorkingOnVM } from "../types";

type WorkingOnCardProps = {
  workingOn: WorkingOnVM;
};

export default function WorkingOnCard({ workingOn }: WorkingOnCardProps) {
  return (
    <Card className="gap-4 border-slate-200 py-4">
      <CardHeader className="px-4">
        <CardTitle className="text-sm font-semibold">You&apos;re Working On</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-4">
        {workingOn.isEmpty ? (
          <div className="rounded-lg border border-slate-200 p-4 text-center">
            <div className="text-xl font-semibold text-teal-800">{workingOn.emptyLabel}</div>
          </div>
        ) : (
          workingOn.items.map((item) => (
            <div key={`${item.title}-${item.meta}`} className="rounded-lg border border-slate-200 p-3">
              <div className="text-sm font-medium text-slate-700">{item.title}</div>
              <div className="mt-1 text-xs text-slate-500">{item.status}</div>
              {item.meta ? <div className="text-[11px] text-slate-500">{item.meta}</div> : null}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
