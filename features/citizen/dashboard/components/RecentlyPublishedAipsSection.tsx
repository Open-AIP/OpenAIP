import Link from "next/link";
import { CalendarDays, Clock3, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/formatting";
import type { CitizenDashboardPublishedAipCardVM } from "@/lib/types/viewmodels/dashboard";

type RecentlyPublishedAipsSectionProps = {
  items: CitizenDashboardPublishedAipCardVM[];
  fiscalYear: number;
};

export default function RecentlyPublishedAipsSection({ items, fiscalYear }: RecentlyPublishedAipsSectionProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2 text-center">
        <h2 className="text-4xl font-semibold text-[#0b5188]">Recently Published AIPs</h2>
        <p className="text-base text-slate-500">Latest published Annual Investment Plans for FY {fiscalYear}</p>
      </div>

      {items.length === 0 ? (
        <Card className="border-dashed border-slate-300">
          <CardContent className="p-6 text-center text-sm text-slate-500">No recent published AIPs.</CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {items.map((item) => (
            <Card key={item.aipId} className="border-slate-200">
              <CardContent className="space-y-3 p-4 text-left">
                <div className="flex items-center gap-2">
                  <div className="grid h-8 w-8 place-items-center rounded-md bg-emerald-100 text-emerald-700">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.scopeName}</p>
                    <p className="text-xs capitalize text-slate-500">{item.scopeType}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500">
                  <CalendarDays className="mr-1 inline h-3 w-3" />
                  Published: {item.publishedDate ? formatDate(item.publishedDate) : "N/A"}
                </p>
                <p className="text-xs text-slate-500">
                  <Clock3 className="mr-1 inline h-3 w-3" />
                  FY {item.fiscalYear}
                </p>
                <Button asChild className="w-full bg-[#0da548] hover:bg-[#0b8a3d]">
                  <Link href={item.href}>View AIP</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
