import DonutCard, { type DonutSectorItem } from "./DonutCard";
import LineTrendsCard, { type SectorTrendPoint } from "./LineTrendsCard";

type ChartsGridProps = {
  fiscalYear: number;
  totalBudget: number;
  sectors: DonutSectorItem[];
  trendSubtitle: string;
  trendData: SectorTrendPoint[];
};

export default function ChartsGrid({
  fiscalYear,
  totalBudget,
  sectors,
  trendSubtitle,
  trendData,
}: ChartsGridProps) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.35fr]">
        <DonutCard fiscalYear={fiscalYear} totalBudget={totalBudget} sectors={sectors} />
        <LineTrendsCard subtitle={trendSubtitle} data={trendData} />
      </div>
    </section>
  );
}
