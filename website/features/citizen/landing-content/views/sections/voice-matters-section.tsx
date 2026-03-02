import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FeedbackSnapshotVM } from "@/lib/domain/landing-content";
import FullScreenSection from "../../components/layout/full-screen-section";
import VoiceMattersTrendsChart from "./voice-matters-trends-chart.client";
import {
  MotionInView,
  MotionItem,
  MotionPressable,
  MotionStagger,
} from "../../components/motion/motion-primitives";

type VoiceMattersSectionProps = {
  vm: FeedbackSnapshotVM;
};

type ParsedSeries = {
  key: string;
  label: string;
  points: number[];
  color: string;
};

const SERIES_COLORS = ["#8B7CFF", "#F08B73"];
const Y_TICKS = [0, 40, 80, 120, 160, 200];
const CHART_MAX = 200;

function sanitizeSnapshot(vm: FeedbackSnapshotVM): { months: string[]; series: ParsedSeries[] } {
  const months = (vm.months ?? []).map((month) => month.trim()).filter(Boolean);

  const rawSeries = (vm.series ?? [])
    .slice(0, 2)
    .map((series, index) => ({
      key: series.key,
      label: series.label || series.key,
      color: SERIES_COLORS[index] ?? "#67E8F9",
      points: (series.points ?? []).map((point) => (Number.isFinite(point) ? point : 0)),
    }))
    .filter((series) => series.points.length > 0);

  if (!months.length || !rawSeries.length) {
    return { months: [], series: [] };
  }

  const pointCount = Math.min(months.length, ...rawSeries.map((series) => series.points.length));
  if (pointCount <= 0) {
    return { months: [], series: [] };
  }

  return {
    months: months.slice(0, pointCount),
    series: rawSeries.map((series) => ({ ...series, points: series.points.slice(0, pointCount) })),
  };
}

function FeedbackTrendsCard({ vm }: { vm: FeedbackSnapshotVM }) {
  const parsed = sanitizeSnapshot(vm);

  return (
    <div className="space-y-4">
      <h3 className="text-4xl font-bold text-darkslategray text-[#0C2C3A]">Feedback Trends</h3>
      <div className="rounded-2xl border border-white/10 bg-[#0b2f3a] px-4 py-5 sm:px-5">
        <VoiceMattersTrendsChart months={parsed.months} series={parsed.series} yTicks={Y_TICKS} chartMax={CHART_MAX} />
      </div>
    </div>
  );
}

function ResponseRateCard({ vm }: { vm: FeedbackSnapshotVM }) {
  return (
    <div className="flex min-h-[165px] flex-col items-center justify-center rounded-2xl border border-white/10 bg-[#0b2f3a] px-2 py-5 text-center">
      <p className="text-3xl font-semibold leading-none text-white">Response Rate</p>
      <p className="mt-2 text-6xl font-bold leading-none text-[#05C7F2]">{vm.responseRate}%</p>
      <p className="mt-3 text-sm text-white/70">Average response time: {vm.avgResponseTimeDays} days</p>
    </div>
  );
}

function HaveAConcernCard() {
  return (
    <div id="voice-feedback" className="flex min-h-[165px] items-center rounded-2xl border border-white/10 bg-[#0b2f3a] px-2 py-5">
      <div className="shrink-0">
        <MessageCircle className="h-25 w-33 text-white/70" aria-hidden="true" strokeWidth={1} />
      </div>
      <div className="space-y-4">
        <p className="text-3xl font-semibold leading-none text-white">Want to Know More?</p>
        <MotionPressable className="inline-flex">
          <Button
            asChild
            className="h-10 rounded-xl bg-[#05C7F2] px-6 text-base font-semibold text-[#001925] hover:bg-[#22d3ee]/90 focus-visible:ring-2 focus-visible:ring-[#67E8F9]"
          >
            <a href="/about-us" aria-label="See About Us">
              See About Us
            </a>
          </Button>
        </MotionPressable>
      </div>
    </div>
  );
}

export default function VoiceMattersSection({ vm }: VoiceMattersSectionProps) {
  const title = vm.title || "Your Voice Matters.";
  const subtitle =
    vm.subtitle ||
    "Track feedback trends and response performance to ensure continued accountability.";

  return (
    <FullScreenSection id="voice-matters" className="bg-[#EDF1F4]">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <header className="text-center">
          <MotionStagger className="space-y-4" delayChildren={0.04}>
            <MotionItem>
              <h2 className="text-6xl font-bold text-darkslategray text-[#0C2C3A]">{title}</h2>
            </MotionItem>
            <MotionItem variant="fadeIn">
              <p className="mx-auto max-w-3xl text-base text-slate-600">{subtitle}</p>
            </MotionItem>
          </MotionStagger>
        </header>

        <div className="grid grid-cols-12 items-stretch gap-8">
          <div className="col-span-12 lg:col-span-7">
            <MotionInView variant="scaleIn">
              <FeedbackTrendsCard vm={vm} />
            </MotionInView>
          </div>

          <MotionStagger className="col-span-12 flex flex-col gap-6 lg:col-span-5 lg:pt-14" delayChildren={0.08}>
            <MotionItem>
              <ResponseRateCard vm={vm} />
            </MotionItem>
            <MotionItem>
              <HaveAConcernCard />
            </MotionItem>
          </MotionStagger>
        </div>
      </div>
    </FullScreenSection>
  );
}
