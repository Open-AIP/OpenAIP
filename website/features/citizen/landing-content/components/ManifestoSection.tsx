import Image from "next/image";
import type { LandingManifestoVM } from "@/lib/domain/landing-content";
import FullScreenSection from "./FullScreenSection";

type ManifestoSectionProps = {
  vm: LandingManifestoVM;
};

const MANIFESTO_BG_SRC = "/citizen-dashboard/school.png";

export default function ManifestoSection({ vm }: ManifestoSectionProps) {
  return (
    <FullScreenSection id="manifesto" className="relative overflow-hidden bg-[#EAF1F5] font-inter">
      <div className="pointer-events-none absolute inset-0">
        <Image
          src={MANIFESTO_BG_SRC}
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-center opacity-[0.06]"
        />
      </div>

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

