import { Badge } from "@/components/ui/badge";

type HeroBannerSectionProps = {
  title: string;
  subtitle: string;
};

export default function HeroBannerSection({ title, subtitle }: HeroBannerSectionProps) {
  return (
    <section className="relative overflow-hidden rounded-xl border border-slate-200 bg-linear-to-br from-[#022437] via-[#0b3652] to-[#114b59] px-6 py-10 text-white shadow-xl md:px-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(255,255,255,0.15),transparent_40%)]" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(to_top,rgba(1,18,48,0.95),transparent)]" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center">
        <Badge className="rounded-full bg-white/10 px-4 py-1 text-xs text-white">OpenAIP Citizen</Badge>
        <h1 className="mt-4 text-4xl font-semibold tracking-[0.25em] text-white md:text-5xl">{title}</h1>
        <p className="mt-3 max-w-3xl text-sm text-slate-100 md:text-base">{subtitle}</p>
      </div>
    </section>
  );
}
