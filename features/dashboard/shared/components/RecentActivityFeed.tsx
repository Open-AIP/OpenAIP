import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RecentActivityItemVM } from "../types";

type RecentActivityFeedProps = {
  recentActivity: RecentActivityItemVM[];
  onViewAudit?: () => void;
};

export default function RecentActivityFeed({ recentActivity, onViewAudit }: RecentActivityFeedProps) {
  return (
    <Card className="gap-4 border-slate-200 py-4">
      <CardHeader className="px-4">
        <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 px-4">
        {recentActivity.map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
            <div>
              <div className="text-sm font-medium text-slate-800">{item.title}</div>
              <div className="text-xs text-slate-500">{item.subtitle ?? item.timestamp}</div>
            </div>
            {item.tag ? (
              <Badge variant="outline" className="rounded-full border-slate-200 bg-slate-50 text-slate-600">
                {item.tag}
              </Badge>
            ) : null}
          </div>
        ))}

        <Button asChild variant="outline" className="w-full" onClick={onViewAudit}>
          <Link href="/barangay/audit">View Audit and Accountability</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
