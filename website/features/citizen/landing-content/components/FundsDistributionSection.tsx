"use client";

import { useMemo, useState } from "react";
import type { SectorDistributionVM } from "@/lib/domain/landing-content";
import FullScreenSection from "./FullScreenSection";
import { cn } from "@/ui/utils";

type FundsDistributionSectionProps = {
  vm: SectorDistributionVM;
};

type DonutSegment = SectorDistributionVM["sectors"][number] & {
  colorClass: string;
  colorHex: string;
};

const COLOR_MAP: Record<string, { colorClass: string; colorHex: string }> = {
  general: { colorClass: "bg-violet-400 text-violet-300", colorHex: "#A78BFA" },
  social: { colorClass: "bg-rose-400 text-rose-300", colorHex: "#FB7185" },
  economic: { colorClass: "bg-cyan-400 text-cyan-300", colorHex: "#22D3EE" },
  other: { colorClass: "bg-amber-400 text-amber-300", colorHex: "#F59E0B" },
};

function formatCompactPeso(value: number): string {
  if (value >= 1_000_000_000) {
    return `₱${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    return `₱${(value / 1_000_000).toFixed(1)}M`;
  }
  return `₱${value.toLocaleString("en-PH")}`;
}

function formatCompactTotal(total: number, unitLabel?: string): string {
  if (unitLabel) {
    return `${(total / 1_000_000).toFixed(1)}`;
  }
  if (total >= 1_000_000) {
    return (total / 1_000_000).toFixed(1);
  }
  return total.toFixed(1);
}

function DonutChart({
  total,
  unitLabel,
  segments,
  size = 260,
  thickness = 22,
  activeKey,
  onHover,
}: {
  total: number;
  unitLabel?: string;
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
  activeKey: string | null;
  onHover: (key: string | null) => void;
}) {
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const processedSegments = useMemo(() => {
    return segments.reduce<{ offset: number; items: Array<DonutSegment & { dashArray: string; dashOffset: number }> }>(
      (acc, segment) => {
        const dash = (segment.percent / 100) * circumference;
        const dashArray = `${dash} ${circumference - dash}`;
        const dashOffset = -acc.offset;
        return {
          offset: acc.offset + dash,
          items: [...acc.items, { ...segment, dashArray, dashOffset }],
        };
      },
      { offset: 0, items: [] }
    ).items;
  }, [circumference, segments]);

  const labelPositions = [
    "top-4 left-1/2 -translate-x-1/2",
    "top-4 left-1/2 -translate-x-1/2",
    "bottom-4 left-1/2 -translate-x-1/2",
    "bottom-4 left-1/2 -translate-x-1/2",
  ];

  const labelOffsets = [
    { x: -120, y: -6 },
    { x: 120, y: -6 },
    { x: -120, y: 6 },
    { x: 120, y: 6 },
  ];

  return (
    <div className="relative grid place-items-center">
      <svg width={size} height={size} className="relative z-10">
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          {processedSegments.map((segment) => {
            const isActive = activeKey ? activeKey === segment.key : true;
            return (
              <circle
                key={segment.key}
                r={radius}
                cx={size / 2}
                cy={size / 2}
                fill="transparent"
                stroke={segment.colorHex}
                strokeWidth={thickness}
                strokeDasharray={segment.dashArray}
                strokeDashoffset={segment.dashOffset}
                strokeLinecap="round"
                className={cn("transition-opacity", isActive ? "opacity-100" : "opacity-40")}
                onMouseEnter={() => onHover(segment.key)}
                onMouseLeave={() => onHover(null)}
              />
            );
          })}
        </g>
      </svg>

      <div className="absolute inset-0 grid place-items-center text-center">
        <p className="text-xs uppercase tracking-[0.24em] text-white/50">Total</p>
        <p className="text-4xl font-semibold text-white">{formatCompactTotal(total, unitLabel)}</p>
        {unitLabel ? <p className="text-xs uppercase text-white/50">{unitLabel}</p> : null}
      </div>

      {segments.map((segment, index) => {
        const positionIndex = index % labelPositions.length;
        const positionClass = labelPositions[positionIndex];
        const isRight = offset.x > 0;
        const offset = labelOffsets[positionIndex];
        return (
          <div
            key={`${segment.key}-label`}
            className={cn(
              "absolute flex items-center gap-2 text-xs text-white/70",
              isRight ? "flex-row" : "flex-row-reverse",
              positionClass
            )}
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px)`,
            }}
          >
            <span className={cn("h-2 w-2 rounded-full", segment.colorClass.split(" ")[0])} />
            <span className="whitespace-nowrap">{segment.label}</span>
            <span
              className={cn(
                "h-px w-16 bg-white/40",
                isRight ? "order-last ml-2" : "order-first mr-2"
              )}
            />
          </div>
        );
      })}
    </div>
  );
}

export default function FundsDistributionSection({ vm }: FundsDistributionSectionProps) {
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const segments: DonutSegment[] = useMemo(
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
            <h2 className="text-4xl font-semibold text-white">How Funds Are Distributed</h2>
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
          <div className="mx-auto flex w-full max-w-3xl min-h-[520px] items-center justify-center rounded-2xl border border-white/10 bg-[#14141C] p-12 shadow-[0_18px_45px_rgba(8,16,24,0.35)]">
            <DonutChart
              total={vm.total}
              unitLabel={vm.unitLabel}
              segments={segments}
              activeKey={activeKey}
              onHover={setActiveKey}
            />
          </div>
        </div>
      </div>
    </FullScreenSection>
  );
}
