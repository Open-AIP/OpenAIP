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
        "relative left-1/2 w-screen -translate-x-1/2 h-screen supports-[height:100svh]:h-[100svh] overflow-y-auto snap-y snap-mandatory scroll-smooth overscroll-y-contain bg-[#E6EDF2]",
        className
      )}
    >
      {children}
    </div>
  );
}

