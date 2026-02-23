import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { DashboardFeedback } from "@/features/dashboard/types/dashboard-types";

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("en-PH", { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function RecentFeedbackCard({
  rows,
  replyAction,
}: {
  rows: DashboardFeedback[];
  replyAction?: (formData: FormData) => Promise<void>;
}) {
  return (
    <Card className="border-slate-200 py-0 shadow-sm">
      <CardContent className="rounded-lg border border-slate-200 p-3">
        <div className="mb-2 text-sm font-medium text-slate-800">Recent Feedback</div>
        <div className="space-y-3">
          {rows.map((item) => (
            <div key={item.id} className="rounded-lg border border-slate-200 p-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="capitalize">{item.kind.replaceAll("_", " ")}</Badge>
                <div className="text-xs text-slate-500">{formatDateTime(item.createdAt)}</div>
              </div>
              <div className="mt-2 text-sm text-slate-700">{item.body}</div>
              {replyAction && (
                <form action={replyAction} className="mt-3 flex gap-2">
                  <input type="hidden" name="parentFeedbackId" value={item.id} />
                  <Input name="body" placeholder="Write quick reply..." />
                  <Button type="submit" variant="outline">Reply</Button>
                </form>
              )}
            </div>
          ))}
          {rows.length === 0 && <div className="rounded-lg border border-slate-200 p-3 text-sm text-slate-500">No recent citizen feedback.</div>}
        </div>
      </CardContent>
    </Card>
  );
}
