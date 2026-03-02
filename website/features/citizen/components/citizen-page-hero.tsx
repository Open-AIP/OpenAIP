import Image from "next/image";
import { cn } from "@/lib/ui/utils";

const CITY_SRC = "/citizen-dashboard/city.png";
const FLAG_SRC = "/citizen-dashboard/flag.jpg";

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
    // ✅ Full-bleed breakout wrapper (no background here)
    <section
      className={cn(
        "relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen",
        className
      )}
    >
      {/* ✅ This creates the “x-axis margin” from the viewport edges */}
      <div className="px-4 sm:px-6 lg:px-8">
        {/* ✅ Actual hero box (background + border + shadow) */}
        <div
          className={cn(
            "relative h-[255px] overflow-hidden border border-[#063d7c] text-white shadow-sm",
            imageSrc
              ? "bg-slate-900"
              : "bg-gradient-to-r from-[#083a8c] via-[#0c4da5] to-[#0a3f8a]"
          )}
        >
          {imageSrc ? (
            <div className="absolute inset-0">
              <Image
                src={imageSrc}
                alt={title}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/65 to-slate-900/25" />
            </div>
          ) : (
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute inset-0 bg-[#3888f1]" />
              <Image
                src={CITY_SRC}
                alt=""
                fill
                className="object-cover object-[center_88%] opacity-92"
                sizes="100vw"
                priority
              />
              <Image
                src={FLAG_SRC}
                alt=""
                fill
                className="object-cover object-center opacity-24"
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-[#3888f1]/50" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,47,111,0.12)_0%,rgba(10,47,111,0.35)_55%,rgba(10,47,111,0.55)_100%)]" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08)_0%,rgba(0,0,0,0.35)_75%,rgba(0,0,0,0.55)_100%)]" />
            </div>
          )}

          {/* ✅ Align hero content with your page width (6xl) */}
          <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col justify-center px-4 text-center sm:px-6 lg:px-8">
            {eyebrow ? (
              <p className="text-xs uppercase tracking-[0.2em] text-slate-100/80">
                {eyebrow}
              </p>
            ) : null}
            <h1
              className="text-3xl font-normal uppercase tracking-[0.06em] text-white md:text-5xl"
              style={{ fontFamily: "var(--font-baskervville-sc), Georgia, serif" }}
            >
              {title}
            </h1>
            <p className="mx-auto mt-4 max-w-4xl text-sm md:text-lg">
              {subtitle}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
