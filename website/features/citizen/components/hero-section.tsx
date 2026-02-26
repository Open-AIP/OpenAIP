'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { MouseEventHandler } from 'react';
import { cn } from '@/ui/utils';

type HeroSectionProps = {
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref?: string;
  onCtaClick?: MouseEventHandler<HTMLButtonElement>;
  ctaAriaLabel?: string;
  backgroundImageSrc?: string;
  scrollHintLabel?: string;
  scrollTargetId?: string;
  className?: string;
};

const ctaBaseClassName =
  'inline-flex items-center justify-center rounded-full bg-powderblue px-7 py-3 text-sm font-semibold text-[#001925] transition-all hover:brightness-105 hover:shadow-[0_10px_24px_rgba(0,0,0,0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-powderblue focus-visible:ring-offset-2 focus-visible:ring-offset-[#022437]';

export default function HeroSection({
  title,
  subtitle,
  ctaLabel,
  ctaHref,
  onCtaClick,
  ctaAriaLabel,
  backgroundImageSrc,
  scrollHintLabel = 'Scroll to explore',
  scrollTargetId,
  className,
}: HeroSectionProps) {
  const scrollHint = scrollTargetId ? (
    <button
      type="button"
      className="group inline-flex flex-col items-center gap-1 text-linen/70 transition hover:text-linen focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-powderblue focus-visible:ring-offset-2 focus-visible:ring-offset-[#022437]"
      onClick={() => {
        document.getElementById(scrollTargetId)?.scrollIntoView({ behavior: 'smooth' });
      }}
      aria-label={scrollHintLabel}
    >
      <span className="text-[13px]">{scrollHintLabel}</span>
      <svg
        className="h-4 w-4 transition-transform group-hover:translate-y-0.5"
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden="true"
      >
        <path d="M5 8.5L10 13.5L15 8.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </button>
  ) : (
    <div className="inline-flex flex-col items-center gap-1 text-linen/70" aria-hidden="true">
      <span className="text-[13px]">{scrollHintLabel}</span>
      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none">
        <path d="M5 8.5L10 13.5L15 8.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </div>
  );

  return (
    <section
      aria-label="AIP hero"
      className={cn(
        'relative w-full overflow-hidden rounded-2xl bg-[#022437] text-linen min-h-screen supports-[height:100svh]:min-h-[100svh]',
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0">
        {backgroundImageSrc ? (
          <Image src={backgroundImageSrc} alt="" fill sizes="100vw" priority className="object-cover object-top" />
        ) : null}
        <Image
          src="/citizen-dashboard/blue-rectangle.png"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-top opacity-50"
        />
        <div className="absolute inset-0 bg-[#022437]/35" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.86)_0%,rgba(0,0,0,0.4)_34.13%,rgba(0,0,0,0.87)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-[48%]">
          <Image src="/citizen-dashboard/city.png" alt="" fill sizes="100vw" className="object-cover object-bottom opacity-95" />
        </div>
      </div>

      <div className="relative z-10 grid min-h-[calc(100vh-4rem)] supports-[height:100svh]:min-h-[calc(100svh-4rem)] grid-rows-[1fr_auto]">
        <div className="flex items-center px-6 pb-10 sm:px-10 sm:pb-12 lg:px-24 lg:pb-16">
          <div className="max-w-[42ch] pt-14 sm:pt-16 lg:pt-20">
            <h1 className="whitespace-pre-line text-[clamp(2.25rem,5.2vw,4.25rem)] font-semibold leading-[1.02] tracking-tight text-linen">
              {title}
            </h1>
            <p className="mt-5 max-w-prose text-[15px] leading-7 text-linen/85 sm:text-base lg:text-[17px] lg:leading-[29px]">
              {subtitle}
            </p>

            <div className="mt-8">
              {onCtaClick ? (
                <button type="button" onClick={onCtaClick} className={ctaBaseClassName} aria-label={ctaAriaLabel ?? ctaLabel}>
                  {ctaLabel}
                </button>
              ) : (
                <Link href={ctaHref ?? '#'} className={ctaBaseClassName} aria-label={ctaAriaLabel ?? ctaLabel}>
                  {ctaLabel}
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center pb-6 sm:pb-7 lg:pb-8">{scrollHint}</div>
      </div>
    </section>
  );
}
