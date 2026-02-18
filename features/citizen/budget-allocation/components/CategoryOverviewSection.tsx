import { Box, Building2, Users, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatPeso } from "@/lib/formatting";
import type { CategoryCardVM } from "@/lib/types/viewmodels/citizen-budget-allocation.vm";
import { categoryAccentClass, categoryIconClass, formatCompactPeso } from "../utils";

const CATEGORY_ICON: Record<string, LucideIcon> = {
  general: Building2,
  social: Users,
  economic: Wallet,
  other: Box,
};

type CategoryOverviewSectionProps = {
  scopeLabel: string;
  cards: CategoryCardVM[];
};

export default function CategoryOverviewSection({ scopeLabel, cards }: CategoryOverviewSectionProps) {
  return (
    <section className="space-y-6">
      <div className="space-y-1 text-center">
        <h2 className="text-5xl font-semibold text-[#0b5188]">{scopeLabel}</h2>
        <p className="text-sm text-slate-500">Total allocations across all four official service categories</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = CATEGORY_ICON[card.categoryKey] ?? Wallet;
          return (
            <Card key={card.categoryKey} className={`border ${categoryAccentClass(card.categoryKey)} shadow-sm`}>
              <CardContent className="space-y-4 p-5">
                <div className="flex items-center gap-2">
                  <div className={`grid h-10 w-10 place-items-center rounded-md bg-transparent ${categoryIconClass(card.categoryKey)}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-base font-semibold leading-none">{card.label}</p>
                    <p className="mt-2 text-xs text-slate-600">Total Allocation</p>
                  </div>
                </div>
                <div>
                  <p className="text-4xl font-semibold leading-none" title={formatPeso(card.totalAmount)}>
                    {formatCompactPeso(card.totalAmount)}
                  </p>
                  <p className="mt-2 text-sm text-slate-700">Projects</p>
                  <p className="text-2xl font-semibold leading-none text-black">{card.projectCount}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
