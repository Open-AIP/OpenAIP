import Image from "next/image";
import type { LandingHeroVM } from "@/lib/domain/landing-content";
import FullScreenSection from "../../components/layout/full-screen-section";
import PrimaryButton from "../../components/atoms/primary-button";

type HeroSectionProps = {
  vm: LandingHeroVM;
};

const BLUE_RECTANGLE_SRC = "/citizen-dashboard/blue-rectangle.png";
const CITY_SRC = "/citizen-dashboard/city.png";
const FLAG_SRC = "/citizen-dashboard/flag.jpg";
const GRADIENT_SRC = "/citizen-dashboard/gradient.png";
const NAVY_RECTANGLE_SRC = "/citizen-dashboard/navy-rectangle.png";

export default function HeroSection({ vm }: HeroSectionProps) {
  const ctaProps =
    vm.ctaHrefOrAction.type === "href"
      ? { href: vm.ctaHrefOrAction.value }
      : { actionKey: vm.ctaHrefOrAction.value };

  return (
    <FullScreenSection id="hero" variant="dark" className="bg-[#EAF1F5] text-linen">
      <div className="relative left-1/2 w-screen -translate-x-1/2 px-3 sm:px-4 md:px-6">
        <div className="relative w-full overflow-hidden rounded-2xl h-[calc(100vh-120px)] min-h-[640px] supports-[height:100svh]:h-[calc(100svh-120px)]">
          <div className="pointer-events-none absolute inset-0">
            <Image
              src={BLUE_RECTANGLE_SRC}
              alt=""
              fill
              sizes="100vw"
              priority
              className="object-cover object-center"
            />
            <Image
              src={CITY_SRC}
              alt=""
              fill
              sizes="100vw"
              className="object-cover object-bottom opacity-93"
            />
            <Image
              src={FLAG_SRC}
              alt=""
              fill
              sizes="100vw"
              className="object-cover object-center opacity-28"
            />

            <Image
              src={NAVY_RECTANGLE_SRC}
              alt=""
              fill
              sizes="100vw"
              className="object-cover object-center opacity-72"
            />
            <Image
              src={GRADIENT_SRC}
              alt=""
              fill
              sizes="100vw"
              className="object-cover object-center opacity-62"
            />
            
          </div>

          <div className="relative z-10 h-full px-6 sm:px-10 lg:px-16">
            <div className="grid h-full grid-cols-12 items-center">
              <div className="col-span-12 lg:col-span-6">
                <h1 className="max-w-[560px] text-[clamp(2.35rem,5.8vw,4.3rem)] font-semibold leading-[1.02] tracking-tight text-linen">
                  {vm.title}
                </h1>
                <p className="mt-5 max-w-[520px] text-[15px] leading-7 text-white/80 md:text-[17px] md:leading-[29px]">
                  {vm.subtitle}
                </p>
                <div className="mt-8">
                  <PrimaryButton label={vm.ctaLabel} ariaLabel={vm.ctaLabel} {...ctaProps} />
                </div>
              </div>
            </div>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/60">
              <span className="inline-flex items-center gap-2 text-sm">
                Scroll to explore
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
                  <path d="M5 8.5L10 13.5L15 8.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </div>
    </FullScreenSection>
  );
}
