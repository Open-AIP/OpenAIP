import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function RecentProjectUpdatesCard({
  flaggedProjects,
  failedPipelineStages,
  editableSummary,
  financialSummary,
}: {
  flaggedProjects: number;
  failedPipelineStages: number;
  editableSummary: string;
  financialSummary: string;
}) {
  return (
    <Card className="border-slate-200 py-0 shadow-sm">
      <CardHeader className="pb-2"><CardTitle className="text-base">Recent Project Updates</CardTitle></CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="rounded-md border border-slate-200 p-3"><div className="text-xs text-slate-500">Flagged Projects</div><div className="text-2xl font-semibold text-slate-900">{flaggedProjects}</div></div>
        <div className="rounded-md border border-slate-200 p-3"><div className="text-xs text-slate-500">Failed Pipeline Stages</div><div className="text-2xl font-semibold text-slate-900">{failedPipelineStages}</div></div>
        <div className="rounded-md border border-slate-200 p-3"><div className="text-xs text-slate-500">Editable Window</div><div className="text-sm text-slate-700">{editableSummary}</div></div>
        <div className="rounded-md border border-slate-200 p-3"><div className="text-xs text-slate-500">Financial Sum Check (PS+MOOE+CO)</div><div className="text-sm text-slate-700">{financialSummary}</div></div>
      </CardContent>
    </Card>
  );
}
