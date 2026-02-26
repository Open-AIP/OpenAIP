import Image from "next/image";
import { cn } from "@/ui/utils";

type CitizenPageHeroProps = {
  title: string;
  subtitle: string;
  eyebrow?: string;
  imageSrc?: string;
  className?: string;
};

export default function CitizenPageHero({
  title,
  subtitle,
  eyebrow,
  imageSrc,
  className,
}: CitizenPageHeroProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-xl border border-[#063d7c] px-6 py-10 text-white shadow-sm md:px-10",
        imageSrc
          ? "bg-slate-900"
          : "bg-gradient-to-r from-[#083a8c] via-[#0c4da5] to-[#0a3f8a]",
        className
      )}
    >
      {imageSrc ? (
        <div className="absolute inset-0">
          <Image src={imageSrc} alt={title} fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/65 to-slate-900/25" />
        </div>
      ) : (
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.18),transparent_45%)]" />
          <div className="absolute inset-x-0 bottom-0 h-20 opacity-35 [background:repeating-linear-gradient(90deg,rgba(255,255,255,0.35)_0_12px,transparent_12px_22px)]" />
        </div>
      )}

      <div className="relative z-10 text-center">
        {eyebrow ? (
          <p className="text-xs uppercase tracking-[0.2em] text-slate-100/80">{eyebrow}</p>
        ) : null}
        <h1 className="text-3xl font-semibold tracking-[0.06em] md:text-5xl">{title}</h1>
        <p className="mx-auto mt-4 max-w-4xl text-sm md:text-lg">{subtitle}</p>
      </div>
    </section>
  );
}
