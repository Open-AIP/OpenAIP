import { Button } from "@/components/ui/button";
import type { FeedbackSnapshotVM } from "@/lib/domain/landing-content";
import FullScreenSection from "../../components/layout/full-screen-section";

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

function mapChartY(value: number, topPad: number, plotHeight: number): number {
  const safeValue = Math.max(0, Math.min(CHART_MAX, value));
  return topPad + ((CHART_MAX - safeValue) / CHART_MAX) * plotHeight;
}

function buildPolylinePoints(
  values: number[],
  leftPad: number,
  plotWidth: number,
  topPad: number,
  plotHeight: number
): string {
  if (!values.length) {
    return "";
  }

  return values
    .map((value, index) => {
      const x =
        values.length === 1 ? leftPad + plotWidth / 2 : leftPad + (index / (values.length - 1)) * plotWidth;
      const y = mapChartY(value, topPad, plotHeight);
      return `${x},${y}`;
    })
    .join(" ");
}

function FeedbackTrendsCard({ vm }: { vm: FeedbackSnapshotVM }) {
  const parsed = sanitizeSnapshot(vm);
  const chartWidth = 660;
  const chartHeight = 350;
  const leftPad = 52;
  const rightPad = 26;
  const topPad = 22;
  const bottomPad = 86;
  const plotWidth = chartWidth - leftPad - rightPad;
  const plotHeight = chartHeight - topPad - bottomPad;
  const xAxisY = topPad + plotHeight;

  return (
    <div className="space-y-4">
      <h3 className="text-4xl font-bold text-darkslategray text-[#0C2C3A]">Feedback Trends</h3>
      <div className="rounded-2xl border border-white/10 bg-[#0b2f3a] px-4 py-5 sm:px-5">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="h-[320px] w-full" role="img" aria-label="Feedback trends chart">
          {Y_TICKS.map((tick) => {
            const y = mapChartY(tick, topPad, plotHeight);
            return (
              <g key={tick}>
                <line x1={leftPad} y1={y} x2={chartWidth - rightPad} y2={y} stroke="rgba(255,255,255,0.14)" strokeWidth="1" />
                <text x={leftPad - 10} y={y + 4} textAnchor="end" fontSize="12" fill="rgba(255,255,255,0.75)">
                  {tick}
                </text>
              </g>
            );
          })}

          <line x1={leftPad} y1={xAxisY} x2={chartWidth - rightPad} y2={xAxisY} stroke="rgba(255,255,255,0.35)" strokeWidth="1" />

          {parsed.months.map((month, index) => {
            const x =
              parsed.months.length === 1
                ? leftPad + plotWidth / 2
                : leftPad + (index / (parsed.months.length - 1)) * plotWidth;

            return (
              <text key={`${month}-${index}`} x={x} y={xAxisY + 18} textAnchor="middle" fontSize="12" fill="rgba(255,255,255,0.74)">
                {month}
              </text>
            );
          })}

          {parsed.series.map((series) => {
            const points = buildPolylinePoints(series.points, leftPad, plotWidth, topPad, plotHeight);
            return (
              <g key={series.key}>
                <polyline
                  points={points}
                  fill="none"
                  stroke={series.color}
                  strokeWidth="2.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {series.points.map((point, index) => {
                  const x =
                    series.points.length === 1
                      ? leftPad + plotWidth / 2
                      : leftPad + (index / (series.points.length - 1)) * plotWidth;
                  const y = mapChartY(point, topPad, plotHeight);

                  return <circle key={`${series.key}-${index}`} cx={x} cy={y} r="3" fill="#0b2f3a" stroke={series.color} strokeWidth="1.4" />;
                })}
              </g>
            );
          })}

          <g transform={`translate(${chartWidth / 2}, ${chartHeight - 24})`}>
            {parsed.series.map((series, index) => {
              const offsetX = index === 0 ? -56 : 18;
              return (
                <g key={`${series.key}-legend`} transform={`translate(${offsetX}, 0)`}>
                  <line x1="0" y1="0" x2="12" y2="0" stroke={series.color} strokeWidth="2.25" />
                  <circle cx="6" cy="0" r="2.6" fill="#0b2f3a" stroke={series.color} strokeWidth="1.2" />
                  <text x="18" y="4" fontSize="12" fill="rgba(255,255,255,0.8)">
                    {series.label}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
}

function ResponseRateCard({ vm }: { vm: FeedbackSnapshotVM }) {
  return (
    <div className="flex min-h-[185px] flex-col items-center justify-center rounded-2xl border border-white/10 bg-[#0b2f3a] px-6 py-8 text-center">
      <p className="text-[2rem] font-semibold leading-none text-white">Response Rate</p>
      <p className="mt-2 text-6xl font-bold leading-none text-powderblue">{vm.responseRate}%</p>
      <p className="mt-3 text-sm text-white/70">Average response time: {vm.avgResponseTimeDays} days</p>
    </div>
  );
}

function HaveAConcernCard() {
  return (
    <div id="voice-feedback" className="flex min-h-[185px] items-center rounded-2xl border border-white/10 bg-[#0b2f3a] px-6 py-8">
      <div className="mr-5 shrink-0">
        <svg width="82" height="68" viewBox="0 0 82 68" fill="none" aria-hidden="true">
          <path
            d="M22.2 56.4L6.5 62.5L12 46.6C8.3 42.5 6 37.2 6 31.4C6 17.9 19 7 35 7C51 7 64 17.9 64 31.4C64 45 51 55.8 35 55.8C30.5 55.8 26.3 54.9 22.2 56.4Z"
            stroke="rgba(255,255,255,0.74)"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="space-y-4">
        <p className="text-[2rem] font-semibold leading-none text-white">Have a Concern?</p>
        {/* TODO: Replace hash anchor with real citizen feedback submission route when available. */}
        <Button
          asChild
          className="h-10 rounded-full bg-[#22d3ee] px-6 text-base font-semibold text-[#001925] hover:bg-[#22d3ee]/90 focus-visible:ring-2 focus-visible:ring-[#67E8F9]"
        >
          <a href="#voice-feedback" aria-label="Submit feedback">
            Submit Feedback
          </a>
        </Button>
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
        <header className="space-y-4 text-center">
          <h2 className="text-4xl font-bold text-darkslategray text-[#0C2C3A]">{title}</h2>
          <p className="mx-auto max-w-3xl text-base text-slate-600">{subtitle}</p>
        </header>

        <div className="grid grid-cols-12 items-stretch gap-8">
          <div className="col-span-12 lg:col-span-7">
            <FeedbackTrendsCard vm={vm} />
          </div>

          <div className="col-span-12 flex flex-col gap-6 lg:col-span-5">
            <ResponseRateCard vm={vm} />
            <HaveAConcernCard />
          </div>
        </div>
      </div>
    </FullScreenSection>
  );
}
