import { Card, CardContent } from "@/components/ui/card";
import type { PulseKpisVM } from "../types";

type PulseKpisProps = {
  kpis: PulseKpisVM;
};

export default function PulseKpis({ kpis }: PulseKpisProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <Card className="gap-1 border-slate-200 py-3">
        <CardContent className="px-3">
          <div className="text-[11px] text-slate-500">New This Week</div>
          <div className="text-3xl font-semibold text-slate-900">{kpis.newThisWeek}</div>
        </CardContent>
      </Card>
      <Card className="gap-1 border-rose-200 bg-rose-50 py-3">
        <CardContent className="px-3">
          <div className="text-[11px] text-rose-700">Awaiting Reply</div>
          <div className="text-3xl font-semibold text-rose-700">{kpis.awaitingReply}</div>
        </CardContent>
      </Card>
      <Card className="gap-1 border-slate-200 py-3">
        <CardContent className="px-3">
          <div className="text-[11px] text-slate-500">Hidden</div>
          <div className="text-3xl font-semibold text-slate-900">{kpis.hidden}</div>
        </CardContent>
      </Card>
    </div>
  );
}
