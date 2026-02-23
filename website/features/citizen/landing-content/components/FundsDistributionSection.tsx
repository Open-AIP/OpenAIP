import { formatPeso } from "@/lib/formatting";
import type { SectorDistributionVM } from "@/lib/domain/landing-content";
import { cn } from "@/ui/utils";
import CardShell from "./CardShell";
import FullScreenSection from "./FullScreenSection";
import SectionHeader from "./SectionHeader";

type FundsDistributionSectionProps = {
  vm: SectorDistributionVM;
};

const RING_COLORS = ["#67E8F9", "#2DD4BF", "#FCA5A5", "#FBBF24", "#A5B4FC", "#93C5FD"];

function buildDonutGradient(distribution: SectorDistributionVM) {
  let running = 0;
  const stops = distribution.sectors.map((sector, index) => {
    const start = running;
    running += sector.percent;
    return `${RING_COLORS[index % RING_COLORS.length]} ${start}% ${running}%`;
  });
  return `conic-gradient(${stops.join(", ")})`;
}

export default function FundsDistributionSection({ vm }: FundsDistributionSectionProps) {
  return (
    <FullScreenSection id="funds-distribution" variant="dark" className="bg-[#022437]">
      <div className="grid items-center gap-8 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-5">
          <SectionHeader
            title="How Funds Are Distributed"
            subtitle="Sector-level distribution of total planned investment for the selected fiscal year."
          />

          <div className="space-y-3">
            {vm.sectors.map((sector) => (
              <div
                key={sector.key}
                className="group grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 transition hover:border-[#67E8F9]/40 hover:bg-white/[0.07]"
              >
                <span className="text-sm text-slate-100">{sector.label}</span>
                <span className="text-sm font-semibold text-slate-100">{formatPeso(sector.amount)}</span>
                <span className="text-xs font-medium text-[#9ED3E0]">{sector.percent.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>

        <CardShell className="mx-auto max-w-xl border-white/10 bg-[#071A25] py-0">
          <div className="grid place-items-center p-8">
            <div
              className="grid aspect-square w-[min(70vw,320px)] place-items-center rounded-full p-9"
              style={{ background: buildDonutGradient(vm) }}
              aria-label="Sector allocation donut placeholder"
            >
              <div className="grid h-full w-full place-items-center rounded-full bg-[#071A25] text-center">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Total</p>
                <p className={cn("text-2xl font-semibold", "text-slate-100")}>{formatPeso(vm.totalAmount)}</p>
              </div>
            </div>
          </div>
        </CardShell>
      </div>
    </FullScreenSection>
  );
}

