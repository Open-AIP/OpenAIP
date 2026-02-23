import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DashboardHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="h-[68px] w-full border-b border-gray-200 bg-white px-6 flex flex-wrap items-center gap-3">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">{title}</h1>
        <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
      </div>
    </div>
  );
}

export function DateCard({ label }: { label: string }) {
  const parsed = new Date(label);
  const hasDate = !Number.isNaN(parsed.getTime());
  const dayNumber = hasDate ? parsed.toLocaleDateString("en-PH", { day: "2-digit" }) : "--";
  const weekday = hasDate ? parsed.toLocaleDateString("en-PH", { weekday: "long" }).toUpperCase() : "TODAY";
  const monthYear = hasDate
    ? parsed.toLocaleDateString("en-PH", { month: "long", year: "numeric" }).toUpperCase()
    : label.toUpperCase();

  return (
    <Card className="bg-white border border-gray-200 rounded-xl py-0 shadow-sm h-[79px] bg-gradient-to-r from-slate-600 to-slate-900">
      <CardContent className="p-5">
        <div className="flex items-center gap-3">
          <div className="text-5xl font-semibold leading-none text-white">{dayNumber}</div>
          <div>
            <div className="text-sm text-white/90">{weekday}</div>
            <div className="text-xs text-white/80">{monthYear}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function WorkingOnCard({ items }: { items: Array<{ id: string; label: string; href: string }> }) {
  return (
    <Card className="bg-white border border-gray-200 rounded-xl py-0 shadow-sm">
      <CardHeader className="p-5 pb-0"><CardTitle className="text-sm font-medium text-slate-700">You&apos;re Working On</CardTitle></CardHeader>
      <CardContent className="p-5 space-y-3">
        {items.length === 0 ? (
          <div className="mt-10 text-center text-xl font-semibold text-slate-800">All Caught Up</div>
        ) : (
          items.map((item) => (
            <Link key={item.id} href={item.href} className="block rounded-lg border border-gray-200 bg-white p-3 text-sm text-slate-700 hover:bg-slate-50">
              {item.label}
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
