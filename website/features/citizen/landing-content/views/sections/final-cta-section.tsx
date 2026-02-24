import Link from "next/link";
import type { FinalCtaVM } from "@/lib/domain/landing-content";
import { cn } from "@/ui/utils";
import LandingFooter from "../../components/layout/landing-footer";
import FullScreenSection from "../../components/layout/full-screen-section";

type FinalCtaSectionProps = {
  vm?: FinalCtaVM;
};

export default function FinalCtaSection({ vm }: FinalCtaSectionProps) {
  const safeVm: FinalCtaVM = {
    title: vm?.title ?? "Governance Made Visible.",
    subtitle: vm?.subtitle ?? "Stay informed. Stay engaged. Stay empowered.",
    ctaLabel: vm?.ctaLabel ?? "View Full AIP",
    ctaHref: vm?.ctaHref,
  };

  return (
    <FullScreenSection
      id="final-cta"
      variant="dark"
      className="items-stretch bg-[#053645]"
      contentClassName="max-w-none px-0 py-0"
    >
      <div className="flex min-h-screen supports-[height:100svh]:min-h-[100svh] snap-start flex-col">
        <div className="flex flex-1 items-center justify-center px-6 md:px-10 lg:px-14">
          <div className="mx-auto w-full max-w-4xl text-center">
            <h2 className="text-5xl font-bold tracking-tight text-white md:text-6xl">{safeVm.title}</h2>
            <p className="mt-3 text-base text-white/70 md:text-2xl">{safeVm.subtitle}</p>

            <div className="mt-10 flex justify-center">
              {safeVm.ctaHref ? (
                <Link
                  href={safeVm.ctaHref}
                  aria-label="View Full AIP"
                  className="inline-flex items-center justify-center rounded-xl bg-white px-8 py-3 text-base font-semibold text-[#143240] shadow-[0_8px_22px_rgba(0,0,0,0.22)] transition hover:bg-white/95"
                >
                  {safeVm.ctaLabel}
                </Link>
              ) : (
                // TODO: Wire final CTA click action when a destination route is available.
                <button
                  type="button"
                  aria-label="View Full AIP"
                  className={cn(
                    "inline-flex items-center justify-center rounded-xl bg-white px-8 py-3 text-base font-semibold text-[#143240]",
                    "shadow-[0_8px_22px_rgba(0,0,0,0.22)]"
                  )}
                >
                  {safeVm.ctaLabel}
                </button>
              )}
            </div>
          </div>
        </div>

        <LandingFooter />
      </div>
    </FullScreenSection>
  );
}
