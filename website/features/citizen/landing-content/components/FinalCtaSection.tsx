import type { LandingFinalCtaVM } from "@/lib/domain/landing-content";
import FullScreenSection from "./FullScreenSection";
import PrimaryButton from "./PrimaryButton";

type FinalCtaSectionProps = {
  vm: LandingFinalCtaVM;
};

export default function FinalCtaSection({ vm }: FinalCtaSectionProps) {
  const ctaProps =
    vm.ctaHrefOrAction.type === "href"
      ? { href: vm.ctaHrefOrAction.value }
      : { actionKey: vm.ctaHrefOrAction.value };

  return (
    <FullScreenSection id="final-cta" variant="dark" className="bg-[linear-gradient(180deg,#022437,#001925)]">
      <div className="mx-auto max-w-4xl space-y-6 text-center">
        <h2 className="text-4xl font-semibold tracking-tight text-linen md:text-6xl">{vm.title}</h2>
        <p className="mx-auto max-w-2xl text-sm text-linen/80 md:text-base">{vm.subtitle}</p>
        <PrimaryButton label={vm.ctaLabel} ariaLabel={vm.ctaLabel} {...ctaProps} />

        <div className="pt-8 text-xs text-slate-400">
          <p>Cabuyao AIP Portal • Public investment transparency for every resident.</p>
        </div>
      </div>
    </FullScreenSection>
  );
}

