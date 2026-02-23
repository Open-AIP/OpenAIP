import { Box, Building2, Users, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatPeso } from "@/lib/formatting";
import type { CategoryCardVM } from "@/lib/domain/citizen-budget-allocation";
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
        {cards.map((card, idx) => {
          const Icon = CATEGORY_ICON[card.categoryKey] ?? Wallet;
          // choose gradient backgrounds similar to Figma
          const gradients = [
            'linear-gradient(135deg,#eff6ff,#dbeafe)',
            'linear-gradient(135deg,#f0fdf4,#dcfce7)',
            'linear-gradient(135deg,#fefce8,#fef9c2)',
            'linear-gradient(135deg,#f9fafb,#f3f4f6)',
          ];
          const textColors = ['text-steelblue','text-mediumspringgreen','text-goldenrod','text-slategray-400'];

          return (
            <Card key={card.categoryKey} className="shadow-sm" style={{ border: '1px solid #e6eef7', background: gradients[idx] }}>
              <CardContent className="space-y-4 p-5">
                <div className="flex items-center gap-2">
                  <div className={`grid h-20 w-20 place-items-center rounded-md ${categoryIconClass(card.categoryKey)}`}>
                    <Icon className="h-10 w-10" />
                  </div>
                  <div>
                    <p className="text-base font-semibold leading-none">{card.label}</p>
                    <p className="mt-2 text-xs text-slate-600">Total Allocation</p>
                  </div>
                </div>
                <div>
                  <p className={`text-4xl font-semibold leading-none ${textColors[idx]}`} title={formatPeso(card.totalAmount)}>
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
