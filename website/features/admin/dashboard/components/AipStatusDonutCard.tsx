"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { AipStatusDistributionVM } from "@/lib/repos/admin-dashboard/types";

type DonutSegment = AipStatusDistributionVM & {
  percentage: number;
};

const createSegments = (data: AipStatusDistributionVM[]) => {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  return {
    total,
    segments: data.map((item) => ({
      ...item,
      percentage: total ? item.count / total : 0,
    })),
  };
};

export default function AipStatusDonutCard({
  data,
  onStatusClick,
}: {
  data: AipStatusDistributionVM[];
  onStatusClick: (status: string) => void;
}) {
  const { total, segments } = createSegments(data);
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const segmentsWithOffset = segments.map((segment, index) => {
    const offset = segments
      .slice(0, index)
      .reduce((sum, prev) => sum + prev.percentage * circumference, 0);
    return {
      ...segment,
      offset,
      length: segment.percentage * circumference,
    };
  });

  return (
    <Card className="border-slate-200 py-0 shadow-none">
      <CardHeader className="space-y-1 pb-0">
        <CardTitle className="text-[18px]">AIPs by Status</CardTitle>
        <div className="text-[12px] text-slate-500">Distribution across the selected filters.</div>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className="flex flex-col items-center gap-4">
          <div className="relative flex items-center justify-center">
            <svg width="250" height="250" viewBox="0 0 200 200">
              <g transform="translate(100,100) rotate(-90)">
                {segmentsWithOffset.map((segment) => {
                  const dashArray = `${segment.length} ${circumference - segment.length}`;
                  const circle = (
                    <circle
                      key={segment.status}
                      r={radius}
                      cx={0}
                      cy={0}
                      fill="transparent"
                      stroke={segment.color}
                      strokeWidth={24}
                      strokeDasharray={dashArray}
                      strokeDashoffset={-segment.offset}
                      className="cursor-pointer"
                      onClick={() => onStatusClick(segment.status)}
                    />
                  );
                  return circle;
                })}
              </g>
            </svg>
            <div className="absolute text-center">
              <div className="text-[12px] text-slate-500">Total</div>
              <div className="text-[28px] font-semibold text-slate-900">{total}</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[12px] text-slate-600">
            {segments.map((segment) => (
              <Button
                key={segment.status}
                variant="ghost"
                className="h-auto p-0 text-[12px] text-slate-600 hover:bg-transparent hover:text-slate-900"
                onClick={() => onStatusClick(segment.status)}
              >
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: segment.color }} />
                  <span>{segment.label}:</span>
                  <span className="font-medium text-slate-700">{segment.count}</span>
                </span>
              </Button>
            ))}
          </div>
        </div>

        <div className="rounded-[10px] border border-blue-200 bg-blue-50 px-4 py-3 text-[12px] text-blue-700">
          <b>Interactive Chart:</b> Click a status segment or legend item to open AIP Oversight filtered to that status.
        </div>
      </CardContent>
    </Card>
  );
}
