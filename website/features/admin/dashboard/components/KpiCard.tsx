"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/ui/utils";
import { DASHBOARD_TAG_TONE_STYLES } from "@/lib/ui/tokens";
import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";

export default function KpiCard({
  title,
  value,
  deltaLabel,
  icon: Icon,
  iconClassName,
  ctaLabel,
  ctaHref,
  onCtaClick,
  tagLabel,
  tagTone = "info",
}: {
  title: string;
  value: string | number;
  deltaLabel: string;
  icon: LucideIcon;
  iconClassName?: string;
  ctaLabel: string;
  ctaHref?: string;
  onCtaClick?: () => void;
  tagLabel?: string;
  tagTone?: "info" | "warning" | "danger";
}) {
  const isNegative = deltaLabel.trim().startsWith("-");
  const TrendIcon = isNegative ? ArrowDownRight : ArrowUpRight;
  return (
    <Card className="border-slate-200">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50", iconClassName)}>
            <Icon className="h-4 w-4 text-slate-600" />
          </div>
          {tagLabel && (
            <Badge className={cn("border", DASHBOARD_TAG_TONE_STYLES[tagTone])}>{tagLabel}</Badge>
          )}
        </div>
        <div>
          <div className="text-[28px] font-semibold text-slate-900">{value}</div>
          <div className="text-[12px] text-slate-500">{title}</div>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-slate-500">
          <TrendIcon className={cn("h-3.5 w-3.5", isNegative ? "text-rose-500" : "text-emerald-500")} />
          <span>{deltaLabel}</span>
        </div>
        {onCtaClick ? (
          <Button variant="outline" className="w-full justify-between text-[12px]" type="button" onClick={onCtaClick}>
            <span>{ctaLabel}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button variant="outline" className="w-full justify-between text-[12px]" asChild>
            <Link href={ctaHref ?? "#"}>
              <span>{ctaLabel}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
