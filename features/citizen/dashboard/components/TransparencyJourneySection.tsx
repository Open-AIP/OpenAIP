import { CalendarDays, Clock3, FileText, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { CitizenDashboardTransparencyStepVM } from "@/lib/types/viewmodels/dashboard";
import { getStepTone } from "../utils";

type TransparencyJourneySectionProps = {
  steps: CitizenDashboardTransparencyStepVM[];
};

function getStepIcon(step: CitizenDashboardTransparencyStepVM) {
  if (step.stepKey === "published") return <ShieldCheck className="h-4 w-4" />;
  if (step.stepKey === "reviewed") return <Clock3 className="h-4 w-4" />;
  if (step.stepKey === "approved") return <FileText className="h-4 w-4" />;
  return <CalendarDays className="h-4 w-4" />;
}

export default function TransparencyJourneySection({ steps }: TransparencyJourneySectionProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2 text-center">
        <h2 className="text-4xl font-semibold text-[#0b5188]">Transparency Journey</h2>
        <p className="text-base text-slate-500">Track the progress of AIP submissions through each stage of the review process</p>
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        {steps.map((step, index) => (
          <Card key={step.stepKey} className={`relative text-center shadow-sm ${getStepTone(step)}`}>
            {index < steps.length - 1 ? (
              <div className="pointer-events-none absolute right-[-24px] top-10 hidden h-0.5 w-11 bg-[#b5cde0] md:block" />
            ) : null}
            <CardContent className="space-y-2 p-3">
              <div className="mx-auto grid h-7 w-7 place-items-center rounded-full border border-slate-300 bg-white text-[11px] font-semibold text-slate-500">
                {index + 1}
              </div>
              <div className="mx-auto grid h-8 w-8 place-items-center rounded-md bg-white/70">{getStepIcon(step)}</div>
              <p className="text-lg font-semibold text-slate-900">{step.label}</p>
              <p className="text-xs text-slate-500">{step.description}</p>
              <Badge variant="outline">{step.count} LGUs</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mx-auto max-w-2xl rounded-md border-l-4 border-[#0f5d8e] bg-[#edf4fb] p-3 text-sm text-slate-700">
        <span className="font-semibold text-[#0b5188]">Note:</span> Only <span className="font-semibold text-emerald-700">Published</span> AIPs allow document viewing and full budget details.
      </div>
    </div>
  );
}
