import type { LandingManifestoVM } from "@/lib/domain/landing-content";
import FullScreenSection from "../../components/layout/full-screen-section";

type ManifestoSectionProps = {
  vm: LandingManifestoVM;
};

export default function ManifestoSection({ vm }: ManifestoSectionProps) {
  return (
    <FullScreenSection id="manifesto" className="relative overflow-hidden bg-[#EAF1F5] font-inter">
      <div className="relative mx-auto flex min-h-screen max-w-[900px] items-center justify-center">
        <div className="w-full text-center">
          <p className="text-center text-lg font-semibold leading-[21px] tracking-[0.7px] text-steelblue">
            PUBLIC. CLEAR. ACCOUNTABLE.
          </p>
          <div className="mt-6 space-y-2">
            {vm.lines.map((line) => (
              <p key={line} className="text-center text-5xl font-bold leading-[50px] text-darkslategray">
                {line}
              </p>
            ))}
          </div>

          <p className="mt-6 text-center text-6xl font-bold text-steelblue drop-shadow-[0px_3px_10px_rgba(0,0,0,0.25)]">
            Fully Transparent.
          </p>
          <p className="mt-4 text-center text-lg leading-6 text-gray">{vm.subtext}</p>
        </div>
      </div>
    </FullScreenSection>
  );
}
