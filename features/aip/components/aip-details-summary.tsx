"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { AipHeader } from "../types";

export function AipDetailsSummary({
  aip,
  communityLabel = "barangay",
}: {
  aip: AipHeader;
  communityLabel?: string;
}) {
  return (
    <Card className="border-slate-200">
      <CardContent className="p-6 space-y-6">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Summary</h2>
          <p className="mt-2 text-sm text-slate-600">{aip.summaryText}</p>
        </div>

        <div>
          <h3 className="text-base font-semibold text-slate-900">Detailed Description</h3>
          <p className="mt-2 text-sm text-slate-600">
            This comprehensive infrastructure plan addresses the critical needs of our growing {communityLabel} community:
          </p>

          <ol className="mt-3 list-decimal pl-5 space-y-1 text-sm text-slate-600">
            {aip.detailedBullets?.map((b: string, index: number) => (
              <li key={index}>{b}</li>
            ))}
          </ol>

          <p className="mt-4 text-sm text-slate-600">
            These projects will significantly improve the quality of life and accessibility for all residents.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
