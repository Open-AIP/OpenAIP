import Image from "next/image";
import { Badge } from "@/components/ui/badge";

type HeroBannerSectionProps = {
  title: string;
  subtitle: string;
};

export default function HeroBannerSection({ title, subtitle }: HeroBannerSectionProps) {
  return (
    <section className="mx-auto max-w-6xl px-6 pt-6">
      <div className="relative overflow-hidden rounded-2xl border border-[#0d3d60]/30 text-white shadow-sm">
        <div className="relative min-h-[220px] md:min-h-[260px]">
          <Image
            src="/citizen-dashboard/city.png"
            alt="City skyline"
            fill
            className="object-cover object-center"
            sizes="(max-width: 768px) 100vw, 1152px"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#022437]/85 via-[#0b3d63]/70 to-[#0e7490]/55" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(148,233,255,0.18),transparent_45%)]" />
        </div>

        <div className="absolute inset-0 z-10 flex flex-col justify-end px-6 pb-8 md:px-10">
          <Badge className="w-fit rounded-full border border-white/30 bg-white/15 px-4 py-1 text-xs text-white hover:bg-white/15">
            OpenAIP Citizen
          </Badge>
          <h1 className="mt-4 text-4xl font-semibold tracking-[0.04em] text-white md:text-6xl">{title}</h1>
          <p className="mt-3 max-w-3xl text-sm text-cyan-100 md:text-base">{subtitle}</p>
        </div>
      </div>
    </section>
  );
}
