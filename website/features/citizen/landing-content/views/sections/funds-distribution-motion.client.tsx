"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useInView, useReducedMotion, type Variants } from "framer-motion";
import type { SectorDistributionVM } from "@/lib/domain/landing-content";
import DonutChartCitizenDashboard, {
  type DonutChartSegment,
} from "../../components/chart/donut-chart-citizen-dashboard";
import { MOTION_TOKENS, VIEWPORT_ONCE } from "../../components/motion/motion-primitives";
import { cn } from "@/lib/ui/utils";

type FundsDistributionMotionProps = {
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

export default function FundsDistributionMotion({ vm }: FundsDistributionMotionProps) {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [startDraw, setStartDraw] = useState(false);
  const reducedMotion = useReducedMotion() ?? false;
  const rootRef = useRef<HTMLDivElement | null>(null);
  const isInView = useInView(rootRef, VIEWPORT_ONCE);

  const segments: FundsDonutSegment[] = useMemo(
    () =>
      vm.sectors.map((sector) => ({
        ...sector,
        colorClass: COLOR_MAP[sector.key]?.colorClass ?? "bg-slate-400 text-slate-300",
        colorHex: COLOR_MAP[sector.key]?.colorHex ?? "#94A3B8",
      })),
    [vm.sectors]
  );

  useEffect(() => {
    if (!isInView || startDraw) {
      return;
    }

    if (reducedMotion) {
      setStartDraw(true);
      return;
    }

    const timer = window.setTimeout(() => {
      setStartDraw(true);
    }, 260);

    return () => window.clearTimeout(timer);
  }, [isInView, reducedMotion, startDraw]);

  const headerVariants: Variants = {
    hidden: { opacity: 0, y: reducedMotion ? 0 : 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: reducedMotion ? 0.24 : 0.6,
        ease: MOTION_TOKENS.enterEase,
      },
    },
  };

  const pillsContainerVariants: Variants = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: reducedMotion ? 0.06 : 0.1,
        staggerChildren: reducedMotion ? 0 : 0.08,
      },
    },
  };

  const pillItemVariants: Variants = {
    hidden: { opacity: 0, x: reducedMotion ? 0 : -12, y: 0 },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration: reducedMotion ? 0.24 : 0.55,
        ease: MOTION_TOKENS.enterEase,
      },
    },
  };

  const donutContainerVariants: Variants = {
    hidden: { opacity: 0, y: reducedMotion ? 0 : 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: reducedMotion ? 0.28 : 0.7,
        delay: reducedMotion ? 0.1 : 0.24,
        ease: MOTION_TOKENS.enterEase,
      },
    },
  };

  return (
    <motion.div
      ref={rootRef}
      className="mx-auto grid w-full max-w-6xl grid-cols-12 items-center gap-10"
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
    >
      <div className="col-span-12 space-y-5 lg:col-span-5">
        <motion.div className="space-y-3" variants={headerVariants}>
          <h2 className="text-6xl font-semibold text-white">How Funds Are Distributed</h2>
          <p className="text-sm text-white/70">
            A clear view of allocations across General, Social, Economic, and Other sectors.
          </p>
        </motion.div>

        <motion.div className="space-y-3" variants={pillsContainerVariants}>
          {segments.map((sector) => {
            const isActive = activeKey ? activeKey === sector.key : true;
            return (
              <motion.div
                key={sector.key}
                variants={pillItemVariants}
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
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      <motion.div className="col-span-12 lg:col-span-7" variants={donutContainerVariants}>
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
              animate={startDraw}
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
