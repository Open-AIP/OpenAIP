import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/ui/utils";

type CardShellProps = {
  children: ReactNode;
  className?: string;
};

export default function CardShell({ children, className }: CardShellProps) {
  return <Card className={cn("rounded-2xl border-slate-200 bg-white/95 shadow-sm", className)}>{children}</Card>;
}

