"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProjectHighlightVM } from "@/lib/domain/landing-content";
import CardShell from "../../components/atoms/card-shell";
import FullScreenSection from "../../components/layout/full-screen-section";
import ProjectShowcaseCard from "./project-showcase-card";

type InfrastructureProjectsSectionProps = {
  vm: ProjectHighlightVM;
};

type VisibleProject = {
  index: number;
  delta: number;
  project: ProjectHighlightVM["projects"][number];
};

function formatCompactPeso(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `\u20B1${(amount / 1_000_000_000).toFixed(1)}B`;
  }
  if (amount >= 1_000_000) {
    return `\u20B1${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `\u20B1${(amount / 1_000).toFixed(1)}K`;
  }
  return `\u20B1${amount.toLocaleString("en-PH")}`;
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

function getStackStyle(delta: number) {
  const abs = Math.abs(delta);
  const x = abs === 0 ? 0 : 200;
  const scale = abs === 0 ? 1 : 0.75;
  const opacity = abs === 0 ? 1 : 0.62;
  const zIndex = abs === 0 ? 50 : 40;
  const signedX = delta < 0 ? -x : x;

  return {
    zIndex,
    opacity,
    transform: `translate(-50%, -50%) translateX(${signedX}px) scale(${scale})`,
  } as const;
}

export default function InfrastructureProjectsSection({ vm }: InfrastructureProjectsSectionProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const autoDirRef = useRef<-1 | 0 | 1>(0);
  const rafIdRef = useRef<number | null>(null);
  const lastTsRef = useRef(0);
  const cooldownUntilRef = useRef(0);
  const virtualIndexRef = useRef(0);
  const edgeStepRef = useRef<(ts: number) => void>(() => {});

  const safeProjects = useMemo(() => vm.projects ?? [], [vm.projects]);
  const hasMultipleProjects = safeProjects.length > 1;
  const edgeHoverWidth = 80;
  const effectiveActiveIndex =
    safeProjects.length === 0 ? 0 : Math.max(0, Math.min(activeIndex, safeProjects.length - 1));

  useEffect(() => {
    virtualIndexRef.current = effectiveActiveIndex;
  }, [effectiveActiveIndex]);

  const stopEdgeScroll = useCallback(() => {
    autoDirRef.current = 0;
    lastTsRef.current = 0;
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, []);

  useEffect(() => {
    edgeStepRef.current = (ts: number) => {
      if (!hasMultipleProjects) {
        stopEdgeScroll();
        return;
      }

      const dir = autoDirRef.current;
      if (dir === 0 || ts < cooldownUntilRef.current) {
        stopEdgeScroll();
        return;
      }

      const last = lastTsRef.current || ts;
      const dt = ts - last;
      lastTsRef.current = ts;

      const speed = 0.55;
      const pxPerCard = 300;
      const deltaIndex = (dir * dt * speed) / pxPerCard;

      const maxIndex = safeProjects.length - 1;
      const nextFloat = Math.max(0, Math.min(maxIndex, virtualIndexRef.current + deltaIndex));
      virtualIndexRef.current = nextFloat;

      const nextIndex = Math.round(nextFloat);
      setActiveIndex((current) => (current === nextIndex ? current : nextIndex));

      if ((dir < 0 && nextFloat <= 0) || (dir > 0 && nextFloat >= maxIndex)) {
        stopEdgeScroll();
        return;
      }

      rafIdRef.current = requestAnimationFrame((frameTs) => edgeStepRef.current(frameTs));
    };
  }, [hasMultipleProjects, safeProjects.length, stopEdgeScroll]);

  const startEdgeScroll = useCallback(
    (dir: -1 | 1) => {
      if (!hasMultipleProjects) {
        return;
      }

      autoDirRef.current = dir;
      if (rafIdRef.current === null) {
        rafIdRef.current = requestAnimationFrame((ts) => edgeStepRef.current(ts));
      }
    },
    [hasMultipleProjects]
  );

  const onEdgePointerDown = useCallback(
    (dir: -1 | 1) => (e: ReactPointerEvent<HTMLDivElement>) => {
      if (e.pointerType !== "touch") {
        return;
      }

      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      startEdgeScroll(dir);
    },
    [startEdgeScroll]
  );

  const onEdgePointerUp = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (e.pointerType !== "touch") {
        return;
      }
      stopEdgeScroll();
    },
    [stopEdgeScroll]
  );

  const handleStageMouseMove = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      if (!hasMultipleProjects) {
        stopEdgeScroll();
        return;
      }

      const rect = event.currentTarget.getBoundingClientRect();
      const localX = event.clientX - rect.left;

      if (localX <= edgeHoverWidth) {
        startEdgeScroll(-1);
        return;
      }

      if (localX >= rect.width - edgeHoverWidth) {
        startEdgeScroll(1);
        return;
      }

      stopEdgeScroll();
    },
    [edgeHoverWidth, hasMultipleProjects, startEdgeScroll, stopEdgeScroll]
  );

  useEffect(() => stopEdgeScroll, [stopEdgeScroll]);

  const visibleProjects = useMemo<VisibleProject[]>(() => {
    if (!safeProjects.length) {
      return [];
    }

    const start = Math.max(0, effectiveActiveIndex - 1);
    const end = Math.min(safeProjects.length - 1, effectiveActiveIndex + 1);
    const windowProjects: VisibleProject[] = [];

    for (let index = start; index <= end; index += 1) {
      windowProjects.push({
        index,
        delta: index - effectiveActiveIndex,
        project: safeProjects[index],
      });
    }

    return windowProjects;
  }, [effectiveActiveIndex, safeProjects]);

  const goToPrevious = useCallback(() => {
    if (!hasMultipleProjects) {
      return;
    }
    stopEdgeScroll();
    setActiveIndex((current) => Math.max(0, Math.min(current - 1, safeProjects.length - 1)));
  }, [hasMultipleProjects, safeProjects.length, stopEdgeScroll]);

  const goToNext = useCallback(() => {
    if (!hasMultipleProjects) {
      return;
    }
    stopEdgeScroll();
    setActiveIndex((current) => Math.max(0, Math.min(current + 1, safeProjects.length - 1)));
  }, [hasMultipleProjects, safeProjects.length, stopEdgeScroll]);

  const primaryValue = vm.primaryKpiValue ?? vm.totalBudget ?? 0;

  return (
    <FullScreenSection id="infrastructure-projects" className="bg-[#F2ECE5]">
      <div className="grid grid-cols-12 items-center gap-10 lg:gap-24 xl:gap-28">
        <div className="col-span-12 lg:col-span-7 xl:col-span-8">
          <div className="relative w-full lg:max-w-[920px]">
            <div className="relative overflow-hidden rounded-2xl" onMouseLeave={stopEdgeScroll}>
              <div
                className="relative h-[546px] sm:h-[588px]"
                onMouseMove={handleStageMouseMove}
                onWheel={() => {
                  stopEdgeScroll();
                  cooldownUntilRef.current = performance.now() + 250;
                }}
              >
                {visibleProjects.map(({ project, index, delta }) => (
                  <div
                    key={project.id}
                    className="absolute left-1/2 top-1/2 w-[400px] will-change-transform transition-transform transition-opacity duration-300 ease-out"
                    style={getStackStyle(delta)}
                    onClick={() => setActiveIndex(index)}
                  >
                    <ProjectShowcaseCard
                      project={project}
                      budgetLabel={project.budgetLabel ?? formatCompactPeso(project.budget)}
                      tagChipClassName="bg-[#0E5D6F]/90"
                      budgetChipClassName="text-[#0E5D6F]"
                      ctaClassName="border-[#2D6F8F] text-[#1F5D79]"
                      ctaHref="/projects/infrastructure"
                    />
                  </div>
                ))}

                <div
                  className="absolute inset-y-0 left-0 z-[55] w-10 sm:w-12 md:w-16 lg:w-20 pointer-events-auto touch-none"
                  onMouseEnter={() => startEdgeScroll(-1)}
                  onMouseLeave={stopEdgeScroll}
                  onPointerDown={onEdgePointerDown(-1)}
                  onPointerUp={onEdgePointerUp}
                  onPointerCancel={onEdgePointerUp}
                  onPointerLeave={onEdgePointerUp}
                  onLostPointerCapture={onEdgePointerUp}
                />

                <div
                  className="absolute inset-y-0 right-0 z-[55] w-10 sm:w-12 md:w-16 lg:w-20 pointer-events-auto touch-none"
                  onMouseEnter={() => startEdgeScroll(1)}
                  onMouseLeave={stopEdgeScroll}
                  onPointerDown={onEdgePointerDown(1)}
                  onPointerUp={onEdgePointerUp}
                  onPointerCancel={onEdgePointerUp}
                  onPointerLeave={onEdgePointerUp}
                  onLostPointerCapture={onEdgePointerUp}
                />
              </div>
            </div>

            <div className="pointer-events-none absolute inset-y-0 -left-[43px] -right-[43px] z-[70] hidden items-center justify-between lg:flex">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label="Previous project"
                disabled={!hasMultipleProjects || effectiveActiveIndex <= 0}
                className="pointer-events-auto h-16 w-16 rounded-none border-0 bg-transparent text-[#1F2937] shadow-none hover:bg-transparent disabled:opacity-30"
                onClick={goToPrevious}
              >
                <ArrowLeft className="h-14 w-14 stroke-[1.6]" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label="Next project"
                disabled={!hasMultipleProjects || effectiveActiveIndex >= safeProjects.length - 1}
                className="pointer-events-auto h-16 w-16 rounded-none border-0 bg-transparent text-[#1F2937] shadow-none hover:bg-transparent disabled:opacity-30"
                onClick={goToNext}
              >
                <ArrowRight className="h-14 w-14 stroke-[1.6]" />
              </Button>
            </div>
          </div>
        </div>

        <div className="col-span-12 space-y-8 lg:col-span-5 xl:col-span-4">
          <div className="space-y-6">
            <h2 className="max-w-[14ch] text-5xl font-extrabold leading-[0.95] tracking-tight text-[#111827] sm:text-6xl">
              {vm.heading}
            </h2>
            <p className="max-w-[24ch] text-xl leading-[1.45] text-[#495A64] sm:text-2xl">{vm.description}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <CardShell className="py-0">
              <div className="space-y-2 px-5 py-5 sm:px-6 sm:py-6">
                <p className="text-3xl font-bold leading-none text-[#1F2937] sm:text-3xl">{formatCompactPeso(primaryValue)}</p>
                <p className="text-base font-medium text-slate-500">{vm.primaryKpiLabel}</p>
              </div>
            </CardShell>
            <CardShell className="py-0">
              <div className="space-y-2 px-5 py-5 sm:px-6 sm:py-6">
                <p className="text-4xl font-bold leading-none text-[#1F2937] sm:text-4xl">
                  {formatCompactCount(vm.secondaryKpiValue)}
                </p>
                <p className="text-base font-medium text-slate-500">{vm.secondaryKpiLabel}</p>
              </div>
            </CardShell>
          </div>
        </div>
      </div>
    </FullScreenSection>
  );
}
