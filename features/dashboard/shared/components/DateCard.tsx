import { Card, CardContent } from "@/components/ui/card";
import type { DateCardVM } from "../types";

type DateCardProps = {
  dateCard: DateCardVM;
};

export default function DateCard({ dateCard }: DateCardProps) {
  return (
    <Card className="overflow-hidden border-slate-200 py-0">
      <CardContent className="bg-linear-to-r from-sky-900 to-blue-500 px-5 py-4 text-white">
        <div className="flex items-center gap-3">
          <div className="text-5xl font-semibold leading-none">{dateCard.day}</div>
          <div>
            <div className="text-xs font-semibold">{dateCard.weekday}</div>
            <div className="text-xs uppercase tracking-wide">
              {dateCard.month} {dateCard.year}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
