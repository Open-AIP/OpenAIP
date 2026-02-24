import { CardContent } from "@/components/ui/card";
import type { FeedbackSnapshotVM } from "@/lib/domain/landing-content";
import CardShell from "../../components/atoms/card-shell";
import FullScreenSection from "../../components/layout/full-screen-section";
import PrimaryButton from "../../components/atoms/primary-button";
import SectionHeader from "../../components/atoms/section-header";

type VoiceMattersSectionProps = {
  vm: FeedbackSnapshotVM;
};

function buildLinePoints(values: number[]) {
  const max = Math.max(...values, 1);
  const width = 100;
  const height = 100;
  return values
    .map((value, index) => {
      const x = values.length === 1 ? 0 : (index / (values.length - 1)) * width;
      const y = height - (value / max) * height;
      return `${x},${y}`;
    })
    .join(" ");
}

export default function VoiceMattersSection({ vm }: VoiceMattersSectionProps) {
  const valuesA = vm.trendSeries.map((point) => point.valueA);
  const valuesB = vm.trendSeries.map((point) => point.valueB ?? point.valueA);
  const pointsA = buildLinePoints(valuesA);
  const pointsB = buildLinePoints(valuesB);

  return (
    <FullScreenSection id="voice-matters" className="bg-[#EDF1F4]">
      <div className="space-y-8">
        <SectionHeader
          align="center"
          title="Your Voice Matters."
          subtitle="Track feedback trends and response performance across local projects and initiatives."
        />

        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <CardShell className="py-0">
            <CardContent className="space-y-4 p-5">
              <h3 className="text-sm font-semibold text-[#0C2C3A]">Feedback Trends</h3>
              <div className="rounded-xl bg-[#072D40] p-4">
                <svg viewBox="0 0 100 100" className="h-48 w-full" role="img" aria-label="Feedback trend placeholder chart">
                  <g stroke="rgba(255,255,255,0.2)" strokeWidth="0.4">
                    <line x1="0" y1="20" x2="100" y2="20" />
                    <line x1="0" y1="40" x2="100" y2="40" />
                    <line x1="0" y1="60" x2="100" y2="60" />
                    <line x1="0" y1="80" x2="100" y2="80" />
                  </g>
                  <polyline points={pointsA} fill="none" stroke="#67E8F9" strokeWidth="2.3" />
                  <polyline points={pointsB} fill="none" stroke="#A78BFA" strokeWidth="1.7" />
                </svg>
                <div className="mt-2 flex justify-between text-xs text-slate-300">
                  {vm.trendSeries.map((point) => (
                    <span key={point.label}>{point.label}</span>
                  ))}
                </div>
              </div>
            </CardContent>
          </CardShell>

          <div className="space-y-4">
            <CardShell className="py-0">
              <CardContent className="p-5 text-center">
                <p className="text-xs uppercase tracking-[0.2em] text-[#4B88A2]">Response Rate</p>
                <p className="mt-2 text-5xl font-semibold text-[#0E5D6F]">{vm.responseRate}%</p>
                <p className="mt-2 text-sm text-slate-500">Average response time: {vm.avgResponseTimeDays} days</p>
              </CardContent>
            </CardShell>

            <CardShell className="py-0">
              <CardContent className="space-y-3 p-5">
                <p className="text-sm font-medium text-slate-600">Have a concern or suggestion?</p>
                <PrimaryButton label="Submit Feedback" href="/aips" className="w-full" />
              </CardContent>
            </CardShell>
          </div>
        </div>
      </div>
    </FullScreenSection>
  );
}

