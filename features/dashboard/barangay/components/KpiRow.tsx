import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { KpiCardVM } from "../types";

type KpiRowProps = {
  cards: KpiCardVM[];
};

const toneClass: Record<NonNullable<KpiCardVM["tone"]>, string> = {
  neutral: "border-2 border-slate-300 border-l-4 border-l-slate-400 shadow-sm",
  info: "border-2 border-blue-200 border-l-4 border-l-blue-500 shadow-sm",
  success: "border-2 border-emerald-200 border-l-4 border-l-emerald-500 shadow-sm",
  warning: "border-2 border-amber-200 border-l-4 border-l-amber-500 shadow-sm",
};

export default function KpiRow({ cards }: KpiRowProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card
            key={card.id}
            className={`gap-3 py-4 ${toneClass[card.tone ?? "neutral"]}`}
            onClick={card.onClick}
          >
            <CardContent className="space-y-2 px-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{card.label}</span>
                {Icon ? <Icon className="h-4 w-4 text-slate-500" /> : null}
              </div>
              <div className="text-2xl font-semibold text-slate-900">{card.value}</div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                {card.subtext ? <span>{card.subtext}</span> : null}
                {card.badgeText ? (
                  <Badge variant="outline" className="rounded-full border-amber-200 bg-amber-50 text-amber-700">
                    {card.badgeText}
                  </Badge>
                ) : null}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
