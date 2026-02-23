const DONUT_COLORS = ["#0B6477", "#3B82F6", "#10B981", "#F59E0B", "#64748B"];

export function BudgetDonutCard({
  items,
}: {
  items: Array<{ sectorCode: string; label: string; amount: number; percentage: number }>;
}) {
  const donutStops = items.reduce(
    (acc, item, index) => {
      const start = acc.cursor;
      const end = start + item.percentage;
      const color = DONUT_COLORS[index % DONUT_COLORS.length];
      acc.parts.push(`${color} ${start}% ${end}%`);
      acc.cursor = end;
      return acc;
    },
    { parts: [] as string[], cursor: 0 }
  );
  const donutBg =
    donutStops.parts.length > 0 ? `conic-gradient(${donutStops.parts.join(", ")})` : "conic-gradient(#e2e8f0 0 100%)";

  return (
    <div className="grid gap-4 md:grid-cols-[260px_1fr]">
      <div className="mx-auto h-56 w-56 rounded-full" style={{ background: donutBg }}>
        <div className="mx-auto mt-7 h-42 w-42 rounded-full bg-white" />
      </div>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={item.sectorCode} className="grid grid-cols-[16px_1fr_auto_auto] items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: DONUT_COLORS[index % DONUT_COLORS.length] }} />
            <span>{item.label}</span>
            <span className="text-slate-500">{item.percentage.toFixed(0)}%</span>
            <span className="font-medium text-slate-900">{item.amount.toLocaleString("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 })}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
