import type { LandingManifestoVM } from "@/lib/domain/landing-content";
import FullScreenSection from "./FullScreenSection";

type ManifestoSectionProps = {
  vm: LandingManifestoVM;
};

export default function ManifestoSection({ vm }: ManifestoSectionProps) {
  return (
    <FullScreenSection id="manifesto" className="bg-[#EAF1F5]">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#5C96AE]">{vm.eyebrow}</p>
        <div className="mt-6 space-y-1">
          {vm.lines.map((line) => (
            <p key={line} className="text-4xl font-semibold tracking-tight text-[#00293C] md:text-6xl">
              {line}
            </p>
          ))}
        </div>
        <p className="mt-6 text-sm text-slate-600 md:text-base">{vm.subtext}</p>
      </div>
    </FullScreenSection>
  );
}

