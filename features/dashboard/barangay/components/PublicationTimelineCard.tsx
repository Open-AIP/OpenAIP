import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PublicationTimelinePointVM } from "../types";

type PublicationTimelineCardProps = {
  publicationTimeline: PublicationTimelinePointVM[];
};

export default function PublicationTimelineCard({ publicationTimeline }: PublicationTimelineCardProps) {
  return (
    <Card className="gap-4 border-slate-200 py-4">
      <CardHeader className="px-4">
        <CardTitle className="text-sm font-semibold">Publication Timeline</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="grid grid-cols-3 gap-4">
          {publicationTimeline.map((point) => (
            <div key={point.year} className="space-y-2 text-center">
              <div className="mx-auto flex h-32 w-full max-w-30 items-end rounded bg-slate-100 p-2">
                <div className="w-full rounded bg-emerald-500" style={{ height: `${Math.max(point.value * 32, 24)}px` }} />
              </div>
              <div className="text-xs text-slate-500">{point.year}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
