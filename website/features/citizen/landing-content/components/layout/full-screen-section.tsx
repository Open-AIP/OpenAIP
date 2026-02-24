import type { ReactNode } from "react";
import { cn } from "@/ui/utils";

type FullScreenSectionProps = {
  id: string;
  variant?: "light" | "dark";
  className?: string;
  children: ReactNode;
};

export default function FullScreenSection({
  id,
  variant = "light",
  className,
  children,
}: FullScreenSectionProps) {
  return (
    <section
      id={id}
      className={cn(
        "min-h-screen supports-[height:100svh]:min-h-[100svh] snap-start flex items-center",
        variant === "dark" ? "bg-[#022437] text-slate-100" : "bg-[#EDF2F5] text-[#0C2C3A]",
        className
      )}
    >
      <div className="mx-auto w-full max-w-7xl px-6 py-12 md:px-10 lg:px-14 lg:py-16">{children}</div>
    </section>
  );
}

