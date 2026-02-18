import type { ReactNode } from "react";
import { cn } from "@/ui/utils";

export default function ChatWidgetShell({
  isOpen,
  children,
}: {
  isOpen: boolean;
  children: ReactNode;
}) {
  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "fixed bottom-24 right-6 z-50 w-[360px] max-w-[90vw] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl",
        "h-[560px] max-h-[70vh]"
      )}
    >
      {children}
    </div>
  );
}
