import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DashboardHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-4xl font-semibold text-slate-900">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}

export function DateCard({ label }: { label: string }) {
  return (
    <Card className="border-slate-200 py-0 shadow-sm">
      <CardContent className="p-4">
        <div className="text-xs text-slate-500">Today</div>
        <div className="mt-2 text-xl font-semibold text-slate-900">{label}</div>
      </CardContent>
    </Card>
  );
}

export function WorkingOnCard({ items }: { items: Array<{ id: string; label: string; href: string }> }) {
  return (
    <Card className="border-slate-200 py-0 shadow-sm">
      <CardHeader className="pb-2"><CardTitle className="text-lg">You&apos;re Working On</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 ? (
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-700">All caught up.</div>
        ) : (
          items.map((item) => (
            <Link key={item.id} href={item.href} className="block rounded-lg border border-slate-200 p-3 text-sm hover:bg-slate-50">
              {item.label}
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
