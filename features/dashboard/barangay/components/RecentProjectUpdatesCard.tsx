import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/formatting";
import type { ProjectUpdateItemVM } from "../types";

type RecentProjectUpdatesCardProps = {
  items: ProjectUpdateItemVM[];
  onItemClick?: (id: string) => void;
};

export default function RecentProjectUpdatesCard({ items, onItemClick }: RecentProjectUpdatesCardProps) {
  return (
    <Card className="gap-4 border-slate-200 py-4">
      <CardHeader className="px-4">
        <CardTitle className="text-sm font-semibold">Recent Project Updates</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-4">
        <div className="max-h-105 space-y-2 overflow-auto pr-1">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onItemClick?.(item.id)}
              className="w-full rounded-lg border border-slate-200 p-3 text-left"
            >
              <div className="text-sm font-semibold text-slate-800">{item.title}</div>
              <div className="text-xs text-slate-500">{item.category}</div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                <span>{formatDate(item.date)}</span>
                {item.metaRight ? <span>{item.metaRight}</span> : null}
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
