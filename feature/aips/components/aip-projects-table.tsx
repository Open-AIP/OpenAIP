"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TriangleAlert } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { AipDetail } from "@/types";
import { canEditAip, editLockedMessage } from "@/feature/aips/utils";

export function AipProjectsTable({
  aip,
  initialSector,
}: {
  aip: AipDetail;
  initialSector?: string;
}) {
  const editable = canEditAip(aip.status);
  const showFeedback = aip.status === "For Revision";

  const defaultSector = useMemo(
    () => initialSector ?? aip.sectors[0] ?? "All",
    [initialSector, aip.sectors]
  );

  const [sector, setSector] = useState<string>(defaultSector);
  const [query, setQuery] = useState<string>("");

  return (
    <Card className="border-slate-200">
      <CardContent className="p-6 space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h3 className="text-base font-semibold text-slate-900">
            Annual Investment Plan {aip.year} Details
          </h3>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="space-y-1">
              <div className="text-[11px] text-slate-400 text-center sm:text-left">
                Filter by Sector
              </div>
              <Select value={sector} onValueChange={setSector}>
                <SelectTrigger className="w-[180px] bg-slate-50 border-slate-200">
                  <SelectValue placeholder="Sectors" />
                </SelectTrigger>
                <SelectContent>
                  {aip.sectors.map((s: string) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <div className="text-[11px] text-slate-400 text-center sm:text-left">
                Search Projects
              </div>
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by project name or keyword"
                className="w-[240px] bg-slate-50 border-slate-200"
              />
            </div>
          </div>
        </div>

        {/* Table preview area */}
        <div className="border border-slate-200 rounded-lg bg-white overflow-hidden">
          <div className="h-[280px] w-full bg-slate-50 grid place-items-center text-sm text-slate-400">
            {aip.tablePreviewUrl ? (
              <img
                src={aip.tablePreviewUrl}
                alt="AIP table preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <span>Table preview placeholder (add tablePreviewUrl)</span>
            )}
          </div>
        </div>

        {/* Status messaging */}
        {!editable && !showFeedback && (
          <Alert className="border-slate-200 bg-sky-50">
            <TriangleAlert className="h-4 w-4 text-sky-700" />
            <AlertDescription className="text-sky-800">
              {editLockedMessage(aip.status)}
            </AlertDescription>
          </Alert>
        )}

        {showFeedback && (
          <div className="mt-4 p-4 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm">
            <strong>Feedback for Revision:</strong>
            <p className="mt-1">{aip.feedback}</p>
          </div>
        )}

        {/* NOTE:
            sector + query are currently local UI state (same as your original file).
            If you later render an actual projects table, you can filter using sector/query here.
        */}
      </CardContent>
    </Card>
  );
}
