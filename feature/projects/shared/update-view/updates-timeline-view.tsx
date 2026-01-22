import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { ProjectUpdate } from "@/types";
import { CalendarDays } from "lucide-react";

export default function UpdatesTimelineView({
  updates,
}: {
  updates: ProjectUpdate[];
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-slate-900">Updates Timeline</h2>

      <div className="space-y-4">
        {updates.map((u, idx) => (
          <Card key={u.id} className="border-slate-200">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="h-9 w-9 rounded-full bg-[#022437] text-white grid place-items-center text-sm font-semibold shrink-0">
                  {idx + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900">{u.title}</div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                        <CalendarDays className="h-4 w-4 text-slate-400" />
                        {u.date}
                      </div>
                    </div>

                    <Badge
                      variant="outline"
                      className="rounded-full bg-emerald-50 text-emerald-700 border-emerald-200"
                    >
                      {u.progressPercent}% Complete
                    </Badge>
                  </div>

                  <p className="mt-3 text-sm text-slate-600">{u.description}</p>

                  {(u as ProjectUpdate & { attendanceCount?: number }).attendanceCount !== undefined && (
                    <div className="mt-3 text-xs text-slate-500">
                      Attendance:{" "}
                      <span className="text-slate-700 font-medium">
                        {(u as ProjectUpdate & { attendanceCount?: number }).attendanceCount!.toLocaleString()}
                      </span>{" "}
                      participants
                    </div>
                  )}

                  <div className="mt-3">
                    <Progress value={u.progressPercent} />
                  </div>

                  {u.photoUrls?.length ? (
                    <div className="mt-4 flex gap-3">
                      {u.photoUrls.slice(0, 5).map((src: string) => (
                        <div
                          key={src}
                          className="relative h-16 w-16 rounded-lg overflow-hidden border border-slate-200 bg-slate-50"
                        >
                          <Image src={src} alt="Update photo" fill className="object-cover" />
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {!updates.length ? (
          <div className="text-sm text-slate-500">No updates yet.</div>
        ) : null}
      </div>
    </div>
  );
}
