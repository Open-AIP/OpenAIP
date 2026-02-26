import type { ReactNode } from "react";
import { cn } from "@/ui/utils";

type LandingContentCanvasProps = {
  children: ReactNode;
  className?: string;
};

export default function LandingContentCanvas({ children, className }: LandingContentCanvasProps) {
  return (
    <div
      className={cn(
        "relative left-1/2 w-screen -translate-x-1/2 min-h-screen supports-[height:100svh]:min-h-[100svh] bg-[#E6EDF2] [font-family:var(--font-inter)]",
        className
      )}
    >
      {children}
    </div>
  );
}
