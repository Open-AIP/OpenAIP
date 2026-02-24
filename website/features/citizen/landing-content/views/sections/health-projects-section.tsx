"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProjectHighlightVM } from "@/lib/domain/landing-content";
import CardShell from "../../components/atoms/card-shell";
import FullScreenSection from "../../components/layout/full-screen-section";
import { cn } from "@/ui/utils";
import ProjectShowcaseCard from "./project-showcase-card";

type HealthProjectsSectionProps = {
  vm: ProjectHighlightVM;
};

type StackStyle = {
  transform: string;
  opacity: number;
  zIndex: number;
  visible: boolean;
};

function formatCompactPeso(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `₱${(amount / 1_000_000_000).toFixed(1)}B`;
  }
  if (amount >= 1_000_000) {
    return `₱${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `₱${(amount / 1_000).toFixed(1)}K`;
  }
  return `₱${amount.toLocaleString("en-PH")}`;
}

function formatCompactCount(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toLocaleString("en-PH");
}

function normalizeWrappedDelta(index: number, activeIndex: number, length: number): number {
  if (length <= 0) {
    return 0;
  }

  let delta = index - activeIndex;
  const half = Math.floor(length / 2);

  if (delta > half) {
    delta -= length;
  } else if (delta < -half) {
    delta += length;
  }

  return delta;
}

function getCardStackStyle(delta: number): StackStyle {
  const absDelta = Math.abs(delta);

  if (absDelta > 2) {
    return {
      transform: "translate(-50%, -50%) translate3d(0px, 22px, 0) scale(0.84)",
      opacity: 0,
      zIndex: 0,
      visible: false,
    };
  }

  if (absDelta === 0) {
    return {
      transform: "translate(-50%, -50%) translate3d(0px, 0px, 0) scale(1)",
      opacity: 1,
      zIndex: 50,
      visible: true,
    };
  }

  const direction = delta > 0 ? 1 : -1;
  const translateX = absDelta === 1 ? 220 : 380;
  const translateY = absDelta === 1 ? 8 : 18;
  const scale = absDelta === 1 ? 0.95 : 0.9;
  const opacity = absDelta === 1 ? 0.76 : 0.55;
  const zIndex = absDelta === 1 ? 40 : 30;

  return {
    transform: `translate(-50%, -50%) translate3d(${direction * translateX}px, ${translateY}px, 0) scale(${scale})`,
    opacity,
    zIndex,
    visible: true,
  };
}

export default function HealthProjectsSection({ vm }: HealthProjectsSectionProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const safeProjects = useMemo(() => vm.projects ?? [], [vm.projects]);
  const hasMultipleProjects = safeProjects.length > 1;

  useEffect(() => {
    if (safeProjects.length === 0) {
      setActiveIndex(0);
      return;
    }

    setActiveIndex((current) => ((current % safeProjects.length) + safeProjects.length) % safeProjects.length);
  }, [safeProjects.length]);

  const goToNext = () => {
    if (!hasMultipleProjects) {
      return;
    }

    setActiveIndex((current) => (current + 1) % safeProjects.length);
  };

  const goToPrevious = () => {
    if (!hasMultipleProjects) {
      return;
    }

    setActiveIndex((current) => (current - 1 + safeProjects.length) % safeProjects.length);
  };

  const primaryValue = vm.primaryKpiValue ?? vm.totalBudget ?? 0;

  return (
    <FullScreenSection id="health-projects" className="bg-[#EFF4F7]">
      <div className="grid grid-cols-12 items-center gap-10">
        <div className="col-span-12 space-y-6 lg:col-span-5">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold leading-none tracking-tight text-[#052434] sm:text-5xl">{vm.heading}</h2>
            <p className="max-w-md text-lg leading-relaxed text-[#4F6E7F]">{vm.description}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <CardShell className="py-0">
              <div className="space-y-1 px-5 py-4">
                <p className="text-xs font-medium text-slate-500">{vm.primaryKpiLabel}</p>
                <p className="text-3xl font-bold leading-none text-[#EC4899]">{formatCompactPeso(primaryValue)}</p>
              </div>
            </CardShell>
            <CardShell className="py-0">
              <div className="space-y-1 px-5 py-4">
                <p className="text-xs font-medium text-slate-500">{vm.secondaryKpiLabel}</p>
                <p className="text-3xl font-bold leading-none text-[#EC4899]">
                  {formatCompactCount(vm.secondaryKpiValue)}
                </p>
              </div>
            </CardShell>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-7">
          <div className="relative h-[470px] overflow-hidden" tabIndex={0}>
            {safeProjects.map((project, index) => {
              const delta = normalizeWrappedDelta(index, activeIndex, safeProjects.length);
              const stackStyle = getCardStackStyle(delta);

              return (
                <div
                  key={project.id}
                  className={cn(
                    "absolute left-1/2 top-1/2 w-[360px] will-change-transform transition-transform transition-opacity duration-300 ease-out",
                    !stackStyle.visible && "pointer-events-none"
                  )}
                  style={{
                    transform: stackStyle.transform,
                    opacity: stackStyle.opacity,
                    zIndex: stackStyle.zIndex,
                  }}
                  onClick={() => {
                    if (stackStyle.visible) {
                      setActiveIndex(index);
                    }
                  }}
                >
                  <ProjectShowcaseCard
                    project={project}
                    budgetLabel={project.budgetLabel ?? formatCompactPeso(project.budget)}
                  />
                </div>
              );
            })}

            <div className="pointer-events-none absolute inset-y-0 left-0 right-0 z-[60] flex items-center justify-between px-2">
              <Button
                type="button"
                size="icon"
                variant="outline"
                aria-label="Go to previous health project"
                disabled={!hasMultipleProjects}
                className="pointer-events-auto rounded-full border-[#3A80A6] bg-white/95 text-[#1F5D79] hover:bg-white disabled:opacity-40"
                onClick={goToPrevious}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <Button
                type="button"
                size="icon"
                variant="outline"
                aria-label="Advance to next health project"
                disabled={!hasMultipleProjects}
                className="pointer-events-auto rounded-full border-[#3A80A6] bg-white/95 text-[#1F5D79] hover:bg-white disabled:opacity-40"
                onClick={goToNext}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </FullScreenSection>
  );
}
