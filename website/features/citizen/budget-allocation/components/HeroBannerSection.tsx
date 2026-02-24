import { Badge } from "@/components/ui/badge";

type HeroBannerSectionProps = {
  title: string;
  subtitle: string;
};

export default function HeroBannerSection({ title, subtitle }: HeroBannerSectionProps) {
  return (
    <section className="relative overflow-hidden rounded-xl border border-slate-200 px-6 py-10 text-white shadow-xl md:px-10"
      style={{ background: 'linear-gradient(180deg, #d3dbe0, #ffffff 99.15%)' }}>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(255,255,255,0.15),transparent_40%)]" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(to_top,rgba(255,255,255,0.9),transparent)]" />
      </div>

      <div className="relative z-10 text-center">
        <Badge className="rounded-full bg-white/10 px-4 py-1 text-xs text-white">OpenAIP Citizen</Badge>
        <h1 className="mt-4 text-5xl md:text-6xl font-baskervville-sc tracking-[1px] text-white">{title}</h1>
        <p className="mt-3 max-w-3xl text-sm text-powderblue md:text-base">{subtitle}</p>
      </div>
    </section>
  );
}
