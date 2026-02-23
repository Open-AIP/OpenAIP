import Image from "next/image";
import type { LandingHeroVM } from "@/lib/domain/landing-content";
import FullScreenSection from "./FullScreenSection";
import PrimaryButton from "./PrimaryButton";

type HeroSectionProps = {
  vm: LandingHeroVM;
};

export default function HeroSection({ vm }: HeroSectionProps) {
  const ctaProps =
    vm.ctaHrefOrAction.type === "href"
      ? { href: vm.ctaHrefOrAction.value }
      : { actionKey: vm.ctaHrefOrAction.value };

  return (
    <FullScreenSection id="hero" variant="dark" className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <Image src="/citizen-dashboard/flag.jpg" alt="" fill sizes="100vw" priority className="object-cover object-top opacity-65" />
        <Image src="/citizen-dashboard/blue-rectangle.png" alt="" fill sizes="100vw" className="object-cover object-top opacity-45" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.86)_0%,rgba(0,0,0,0.42)_34.13%,rgba(0,0,0,0.9)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-[46%]">
          <Image src="/citizen-dashboard/city.png" alt="" fill sizes="100vw" className="object-cover object-bottom opacity-90" />
        </div>
      </div>

      <div className="relative z-10 grid min-h-[calc(100vh-6rem)] w-full supports-[height:100svh]:min-h-[calc(100svh-6rem)] grid-rows-[1fr_auto]">
        <div className="flex items-center">
          <div className="max-w-[42ch]">
            <h1 className="text-[clamp(2.2rem,6vw,4.4rem)] font-semibold leading-[1.02] tracking-tight text-linen">{vm.title}</h1>
            <p className="mt-5 max-w-prose text-[15px] leading-7 text-linen/85 md:text-[17px] md:leading-[29px]">{vm.subtitle}</p>
            <div className="mt-8">
              <PrimaryButton label={vm.ctaLabel} ariaLabel={vm.ctaLabel} {...ctaProps} />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center pb-6 text-linen/70 md:pb-8">
          <span className="inline-flex items-center gap-2 text-sm">
            Scroll to explore
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
              <path d="M5 8.5L10 13.5L15 8.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </span>
        </div>
      </div>
    </FullScreenSection>
  );
}

