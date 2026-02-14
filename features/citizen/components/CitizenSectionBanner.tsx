import Image from "next/image";
import { cn } from "@/ui/utils";

type Props = {
  title?: string;
  description?: string;
  align?: "center" | "left";
  imageSrc?: string;
  eyebrow?: string;
  className?: string;
};

export default function CitizenSectionBanner({
  title = "Annual Investment Plans",
  description = "Explore how your city or barangay plans to use public funds for programs, projects, and community development throughout the year.",
  align = "center",
  imageSrc,
  eyebrow,
  className,
}: Props) {
  const isCentered = align === "center";

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-none border border-[#063d7c] px-6 py-12 text-white shadow-sm md:px-10",
        imageSrc
          ? "bg-slate-900"
          : "bg-gradient-to-r from-[#083a8c] via-[#0c4da5] to-[#0a3f8a]",
        className
      )}
    >
      {imageSrc ? (
        <div className="absolute inset-0">
          <Image src={imageSrc} alt={title} fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-900/20" />
        </div>
      ) : (
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_45%)]" />
          <div className="absolute inset-x-0 bottom-0 h-24 opacity-40 [background:repeating-linear-gradient(90deg,rgba(255,255,255,0.35)_0_12px,transparent_12px_22px)]" />
        </div>
      )}

      <div className={cn("relative z-10", isCentered ? "text-center" : "text-left")}>
        {eyebrow ? (
          <div className="text-xs uppercase tracking-[0.2em] text-slate-100/80">
            {eyebrow}
          </div>
        ) : null}
        <h1 className="text-4xl font-light uppercase tracking-[0.08em] md:text-6xl">{title}</h1>
        <p
          className={cn(
            "mt-4 text-sm text-slate-100 md:text-2xl",
            isCentered ? "mx-auto max-w-4xl" : "max-w-3xl"
          )}
        >
          {description}
        </p>
      </div>
    </section>
  );
}
