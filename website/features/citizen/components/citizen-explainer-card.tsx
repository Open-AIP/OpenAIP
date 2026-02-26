import type { ReactNode } from "react";
import { BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/ui/utils";

type CitizenExplainerCardProps = {
  title: string;
  children?: ReactNode;
  body?: string;
  icon?: ReactNode;
  className?: string;
};

export default function CitizenExplainerCard({
  title,
  children,
  body,
  icon,
  className,
}: CitizenExplainerCardProps) {
  const resolvedIcon = icon ?? (
    <BookOpen className="h-5 w-5 text-[#2563EB]" />
  );

  return (
    <Card className={cn("border border-slate-200 bg-white shadow-sm", className)}>
      <CardContent className="space-y-2 p-6">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">{resolvedIcon}</div>
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-[#022437]">{title}</h2>
            {children ?? (
              <p className="text-sm leading-relaxed text-slate-600 md:text-[15px]">
                {body}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
