"use client";

import { useMemo, useState } from "react";
import type { SectorDistributionVM } from "@/lib/domain/landing-content";
import DonutChartCitizenDashboard, {
  type DonutChartSegment,
} from "../../components/chart/donut-chart-citizen-dashboard";
import FullScreenSection from "../../components/layout/full-screen-section";
import { cn } from "@/ui/utils";

type FundsDistributionSectionProps = {
  vm: SectorDistributionVM;
};

type FundsDonutSegment = DonutChartSegment & {
  amount: number;
};

const COLOR_MAP: Record<string, { colorClass: string; colorHex: string }> = {
  general: { colorClass: "bg-violet-400 text-violet-300", colorHex: "#A78BFA" },
  social: { colorClass: "bg-rose-400 text-rose-300", colorHex: "#FB7185" },
  economic: { colorClass: "bg-cyan-400 text-cyan-300", colorHex: "#22D3EE" },
  other: { colorClass: "bg-amber-400 text-amber-300", colorHex: "#F59E0B" },
};

function formatCompactPeso(value: number): string {
  if (value >= 1_000_000_000) {
    return `\u20b1${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    return `\u20b1${(value / 1_000_000).toFixed(1)}M`;
  }
  return `\u20b1${value.toLocaleString("en-PH")}`;
}

export default function FundsDistributionSection({ vm }: FundsDistributionSectionProps) {
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const segments: FundsDonutSegment[] = useMemo(
    () =>
      vm.sectors.map((sector) => ({
        ...sector,
        colorClass: COLOR_MAP[sector.key]?.colorClass ?? "bg-slate-400 text-slate-300",
        colorHex: COLOR_MAP[sector.key]?.colorHex ?? "#94A3B8",
      })),
    [vm.sectors]
  );

  return (
    <FullScreenSection id="funds-distribution" variant="dark" className="bg-[#001925]">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-12 items-center gap-10">
        <div className="col-span-12 space-y-5 lg:col-span-5">
          <div className="space-y-3">
            <h2 className="text-6xl font-semibold text-white">How Funds Are Distributed</h2>
            <p className="text-sm text-white/70">
              A clear view of allocations across General, Social, Economic, and Other sectors.
            </p>
          </div>

          <div className="space-y-3">
            {segments.map((sector) => {
              const isActive = activeKey ? activeKey === sector.key : true;
              return (
                <div
                  key={sector.key}
                  className={cn(
                    "flex items-center justify-between gap-4 rounded-full border border-white/10 bg-white/5 px-4 py-3 transition",
                    isActive ? "opacity-100" : "opacity-50"
                  )}
                  onMouseEnter={() => setActiveKey(sector.key)}
                  onMouseLeave={() => setActiveKey(null)}
                >
                  <div className="flex items-center gap-3">
                    <span className={cn("h-3 w-3 rounded-full", sector.colorClass.split(" ")[0])} />
                    <span className="text-sm text-white">{sector.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-white">{formatCompactPeso(sector.amount)}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-7">
          <div className="mx-auto flex w-full max-w-3xl min-h-[520px] items-center justify-center rounded-2xl border border-white/10 bg-[#14141C] p-10 shadow-[0_18px_45px_rgba(8,16,24,0.35)] sm:p-12">
            <div className="aspect-square w-full max-w-[340px]">
              <DonutChartCitizenDashboard
                total={vm.total}
                unitLabel={vm.unitLabel}
                segments={segments}
                size={320}
                thickness={24}
                activeKey={activeKey}
                onHover={setActiveKey}
              />
            </div>
          </div>
        </div>
      </div>
    </FullScreenSection>
  );
}
