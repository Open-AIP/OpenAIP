import Image from "next/image";
import { Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { LguOverviewVM } from "@/lib/domain/landing-content";
import { formatNumber, formatPeso } from "@/lib/formatting";
import FullScreenSection from "../../components/layout/full-screen-section";
import LguMapPanel from "../../components/map/lgu-map-panel";
import SectionHeader from "../../components/atoms/section-header";

type LguBudgetOverviewSectionProps = {
  vm: LguOverviewVM;
};

const MAP_PANEL_HEIGHT_CLASS = "h-[420px]";

export default function LguBudgetOverviewSection({ vm }: LguBudgetOverviewSectionProps) {
  return (
    <FullScreenSection id="lgu-budget-overview" className="relative overflow-hidden bg-[#DCE6EC]">
      <div className="pointer-events-none absolute inset-0">
        <Image
          src="/citizen-dashboard/school.png"
          alt=""
          fill
          sizes="10vw"
          className="object-cover object-center opacity-90"
        />
        <div className="absolute inset-0 bg-[#DCE6EC]/58" />
      </div>

      <div className="relative mx-auto w-full max-w-5xl rounded-[28px] border border-slate-200 bg-white/60 p-6 shadow-sm backdrop-blur-sm md:p-8">
        <SectionHeader
          align="center"
          title="LGU Budget Overview"
          subtitle="Explore local government units and view their allocated budgets, project count, and AIP publication status."
        />

        <div className="mt-7 grid grid-cols-12 gap-6">
          <div className="col-span-12 space-y-4 lg:col-span-5">
            <div className="flex items-center gap-3 p-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#0E7490]/12 text-[#0E5D6F]">
                <Building2 className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-4xl font-bold leading-none text-[#0C4F78]">{vm.lguName}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded-sm bg-[#0b4e7b] px-2.5 py-1 text-[11px] font-medium text-white">
                    {vm.scopeLabel}
                  </span>
                  <span className="rounded-sm border-slateblue px-2.5 py-1 text-[11px] font-medium text-slate-600">
                    {vm.fiscalYearLabel}
                  </span>
                </div>
              </div>
            </div>

            <Card className="rounded-2xl border-slate-200 bg-white py-0">
              <CardContent className="space-y-3 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Total Budget</p>
                <p className="text-4xl font-bold leading-none text-[#0C2C3A]">{formatPeso(vm.totalBudget)}</p>
                <div className="inline-flex rounded-md bg-[#10B981]/10 px-2 py-1 text-xs font-medium text-[#0D7B62]">
                  {vm.budgetDeltaLabel ?? "No change"}
                </div>
                <div className="h-1.5 rounded-full bg-slate-200">
                  <div className="h-full w-[42%] rounded-full bg-slate-400" />
                </div>
                <p className="text-xs text-slate-500">42% of regional allocation</p>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-3">
              <Card className="rounded-2xl border-slate-200 bg-white py-0">
                <CardContent className="space-y-2 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Total Projects</p>
                  <p className="text-4xl font-semibold leading-none text-[#0C2C3A]">{formatNumber(vm.projectCount)}</p>
                  <span className="inline-flex rounded-md bg-[#10B981]/10 px-2 py-1 text-xs font-medium text-[#0D7B62]">
                    {vm.projectDeltaLabel ?? "No change"}
                  </span>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-slate-200 bg-white py-0">
                <CardContent className="space-y-3 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">AIP Status</p>
                  <div className="inline-flex items-center gap-2 text-3xl font-semibold leading-none text-[#0C2C3A]">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#0EA97B]" />
                    {vm.aipStatus}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="rounded-2xl border-slate-200 bg-white py-0">
              <CardContent className="flex items-end justify-between p-4">
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Active Users</p>
                  <p className="text-4xl font-semibold leading-none text-[#0C2C3A]">{formatNumber(vm.activeUsers)}</p>
                </div>
                <svg viewBox="0 0 80 24" className="h-6 w-20 text-slate-400" aria-label="Active users trend placeholder">
                  <path
                    d="M2 18C8 17 10 14 16 15C22 16 25 12 31 11C38 10 40 6 47 7C55 8 57 4 64 3C69 2 73 1.5 78 1"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </CardContent>
            </Card>
          </div>

          <div className="col-span-12 lg:col-span-7">
            <LguMapPanel map={vm.map} heightClass={MAP_PANEL_HEIGHT_CLASS} />
            <div className="mt-3 flex flex-wrap gap-2">
              {vm.map.markers.slice(0, 4).map((marker) => (
                <span
                  key={marker.id}
                  className="rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700"
                >
                  {marker.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </FullScreenSection>
  );
}
