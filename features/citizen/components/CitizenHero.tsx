import Image from 'next/image';
import LguYearSearchPill from '@/features/citizen/components/LguYearSearchPill';

export default function CitizenHero() {
  return (
    <section className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-[#022437] via-[#0B3440] to-[#114B59] px-6 py-10 text-white shadow-xl md:px-10 md:py-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.16),transparent_45%)]" />
        <div className="absolute inset-x-0 bottom-0 h-44 bg-[linear-gradient(to_top,rgba(255,255,255,0.15),transparent)]" />
        <div className="absolute bottom-6 left-0 right-0 h-24 opacity-30 [background:repeating-linear-gradient(90deg,rgba(255,255,255,0.24)_0_10px,transparent_10px_18px)]" />
      </div>

      <div className="relative z-10">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-5 grid h-24 w-24 place-items-center rounded-full border border-white/30 bg-white/10 backdrop-blur-sm">
            <Image src="/brand/logo3.svg" alt="OpenAIP emblem" width={64} height={64} className="h-16 w-16" />
          </div>

          <h2 className="text-4xl font-semibold tracking-tight md:text-5xl">
            Open<span className="text-[#67E8F9]">AI</span>P
          </h2>
          <p className="mt-4 text-2xl font-semibold tracking-tight md:text-3xl">See Where Public Funds Go</p>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-100 md:text-base">
            Explore published Annual Investment Programs, monitor local priorities, and follow how public resources
            are allocated across sectors and communities.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:mt-14 md:grid-cols-[1fr_auto_1fr] md:items-end">
          <p className="text-sm font-medium text-slate-100 md:self-end">City of Cabuyao</p>
          <div className="md:justify-self-center">
            <LguYearSearchPill />
          </div>
          <div />
        </div>
      </div>
    </section>
  );
}
