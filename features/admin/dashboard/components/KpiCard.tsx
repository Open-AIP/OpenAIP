"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/ui/utils";
import type { LucideIcon } from "lucide-react";

const tagToneStyles: Record<"info" | "warning" | "danger", string> = {
  info: "bg-blue-50 text-blue-700 border-blue-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  danger: "bg-rose-50 text-rose-700 border-rose-200",
};

export default function KpiCard({
  title,
  value,
  deltaLabel,
  icon: Icon,
  iconClassName,
  ctaLabel,
  ctaHref,
  tagLabel,
  tagTone = "info",
}: {
  title: string;
  value: string | number;
  deltaLabel: string;
  icon: LucideIcon;
  iconClassName?: string;
  ctaLabel: string;
  ctaHref: string;
  tagLabel?: string;
  tagTone?: "info" | "warning" | "danger";
}) {
  return (
    <Card className="border-slate-200">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50", iconClassName)}>
            <Icon className="h-4 w-4 text-slate-600" />
          </div>
          {tagLabel && (
            <Badge className={cn("border", tagToneStyles[tagTone])}>{tagLabel}</Badge>
          )}
        </div>
        <div>
          <div className="text-2xl font-semibold text-slate-900">{value}</div>
          <div className="text-[12px] text-slate-500">{title}</div>
        </div>
        <div className="text-[11px] text-slate-500">{deltaLabel}</div>
        <Button variant="outline" className="w-full justify-between text-[12px]" asChild>
          <Link href={ctaHref}>{ctaLabel}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

