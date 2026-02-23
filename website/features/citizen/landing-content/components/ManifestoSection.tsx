import Image from "next/image";
import type { LandingManifestoVM } from "@/lib/domain/landing-content";
import FullScreenSection from "./FullScreenSection";

type ManifestoSectionProps = {
  vm: LandingManifestoVM;
};

const MANIFESTO_BG_SRC = "/citizen-dashboard/school.png";

export default function ManifestoSection({ vm }: ManifestoSectionProps) {
  return (
    <FullScreenSection id="manifesto" className="relative overflow-hidden bg-[#EAF1F5] text-[#0C2C3A]">
      <div className="pointer-events-none absolute inset-0">
        <Image
          src={MANIFESTO_BG_SRC}
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-center opacity-[0.06]"
        />
      </div>

      <div className="relative mx-auto max-w-[900px] text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">PUBLIC. CLEAR. ACCOUNTABLE.</p>
        <div className="mt-6 space-y-2">
          {vm.lines.map((line) => (
            <p key={line} className="text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
              {line}
            </p>
          ))}
        </div>
        <p className="mt-4 text-4xl font-semibold tracking-tight text-[#5E93B0] md:text-6xl">Fully Transparent.</p>
        <p className="mt-6 text-sm text-slate-600 md:text-base">{vm.subtext}</p>
      </div>
    </FullScreenSection>
  );
}

