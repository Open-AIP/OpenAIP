import { CardContent } from "@/components/ui/card";
import { formatNumber, formatPeso } from "@/lib/formatting";
import type { LguOverviewVM } from "@/lib/domain/landing-content";
import CardShell from "./CardShell";
import FullScreenSection from "./FullScreenSection";
import KpiCard from "./KpiCard";
import SectionHeader from "./SectionHeader";

type LguBudgetOverviewSectionProps = {
  vm: LguOverviewVM;
};

export default function LguBudgetOverviewSection({ vm }: LguBudgetOverviewSectionProps) {
  return (
    <FullScreenSection id="lgu-budget-overview" className="bg-[#DCE6EC]">
      <div className="space-y-8">
        <SectionHeader
          align="center"
          title="LGU Budget Overview"
          subtitle={`${vm.lguName} • Fiscal Year ${vm.fiscalYear}`}
        />

        <div className="grid gap-6 lg:grid-cols-[1.02fr_1fr]">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <KpiCard label="Total Budget" value={formatPeso(vm.totalBudget)} />
              <KpiCard label="Project Count" value={formatNumber(vm.projectCount)} />
              <KpiCard label="AIP Status" value={vm.aipStatus} />
              <KpiCard label="Active Users" value={formatNumber(vm.activeUsers)} />
            </div>
          </div>

          <CardShell className="py-0">
            <CardContent className="space-y-4 p-4">
              <div className="relative min-h-[300px] rounded-xl border border-slate-200 bg-[linear-gradient(180deg,#DEE8EF,#F8FBFD)]">
                <div className="absolute inset-x-4 top-4 rounded-lg border border-dashed border-slate-300 bg-white/70 p-3 text-center text-sm text-slate-600">
                  Map preview placeholder
                </div>
                <div className="absolute inset-0 grid place-items-center">
                  <div className="h-20 w-20 rounded-full border-2 border-[#5C96AE]/40 bg-[#5C96AE]/15" />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {vm.markers.map((marker) => (
                  <span key={marker.id} className="rounded-full bg-[#0E7490]/12 px-3 py-1 text-xs font-medium text-[#0E5D6F]">
                    {marker.label}
                    {marker.note ? ` • ${marker.note}` : ""}
                  </span>
                ))}
              </div>
            </CardContent>
          </CardShell>
        </div>
      </div>
    </FullScreenSection>
  );
}

