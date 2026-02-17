import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RecentFeedbackItemVM } from "../types";

type RecentFeedbackCardProps = {
  recentFeedback: RecentFeedbackItemVM[];
};

export default function RecentFeedbackCard({ recentFeedback }: RecentFeedbackCardProps) {
  return (
    <Card className="gap-3 border-slate-200 py-4">
      <CardHeader className="px-4">
        <CardTitle className="text-sm font-semibold">Recent Feedback</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 px-4">
        {recentFeedback.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500">
            No recent feedback items.
          </div>
        ) : (
          recentFeedback.map((item) => (
            <div key={item.id} className="rounded-lg border border-slate-200 p-3">
              <div className="text-[11px] text-slate-500">{item.scopeTag}</div>
              <div className="text-sm font-semibold text-slate-800">{item.title}</div>
              <div className="text-xs text-slate-500">{item.snippet}</div>
              <div className="mt-1 text-[11px] text-slate-500">
                by {item.author} · {item.timeAgo}
              </div>
            </div>
          ))
        )}

        <Button type="button" variant="outline" className="mt-2 h-9 w-full gap-2">
          View All Comments
          <ExternalLink className="h-3.5 w-3.5" />
        </Button>
      </CardContent>
    </Card>
  );
}
