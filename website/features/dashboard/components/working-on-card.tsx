import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
