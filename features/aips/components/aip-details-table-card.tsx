"use client";

import * as React from "react";
import type { AipProjectRow } from "@/feature/aips/types";
import { SECTOR_TABS } from "@/feature/aips/utils";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function LegendItem({ colorClass, label }: { colorClass: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-[11px] text-slate-500">
      <span className={`h-2 w-2 rounded-[2px] ${colorClass}`} />
      <span>{label}</span>
    </div>
  );
}

export function AipDetailsTableCard({
  year,
  rows,
  onRowClick,
}: {
  year: number;
  rows: AipProjectRow[];
  onRowClick: (row: AipProjectRow) => void;
}) {
  const [activeSector, setActiveSector] = React.useState<(typeof SECTOR_TABS)[number]>("General Sector");
  const [query, setQuery] = React.useState("");

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows
      .filter((r) => r.sector === activeSector)
      .filter((r) => {
        if (!q) return true;
        return (
          r.refCode.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q)
        );
      });
  }, [rows, activeSector, query]);

  return (
    <Card className="border-slate-200">
      <CardContent className="p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Annual Investment Plan {year} Details
            </h3>

            <div className="mt-3">
              <Tabs value={activeSector} onValueChange={(v) => setActiveSector(v as any)}>
                <TabsList className="h-7 bg-slate-100 p-1 rounded-full">
                  {SECTOR_TABS.map((s) => (
                    <TabsTrigger
                      key={s}
                      value={s}
                      className="h-5 px-3 text-[11px] rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm"
                    >
                      {s}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          </div>

          <div className="w-full sm:w-[260px]">
            <div className="text-[11px] text-slate-500 mb-1">Search Projects</div>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by project name or keyword"
              className="h-8 bg-white border-slate-200 text-xs"
              aria-label="Search projects"
            />
          </div>
        </div>

        <div className="mt-4 border border-slate-200 rounded-lg overflow-hidden bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="text-xs text-slate-600 font-semibold">AIP Reference Code</TableHead>
                <TableHead className="text-xs text-slate-600 font-semibold">Program Description</TableHead>
                <TableHead className="text-xs text-slate-600 font-semibold text-right">Total Amount</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filtered.map((r) => {
                const rowClass =
                  r.reviewStatus === "ai_flagged"
                    ? "bg-red-50 hover:bg-red-100"
                    : r.reviewStatus === "reviewed"
                    ? "bg-blue-50 hover:bg-blue-100"
                    : "hover:bg-slate-50";

                return (
                  <TableRow
                    key={r.id}
                    className={`cursor-pointer ${rowClass}`}
                    onClick={() => onRowClick(r)}
                  >
                    <TableCell className="text-xs text-slate-700">{r.refCode}</TableCell>
                    <TableCell className="text-xs text-slate-700">{r.description}</TableCell>
                    <TableCell className="text-xs text-slate-700 text-right tabular-nums">
                      ₱{r.amount.toLocaleString()}
                    </TableCell>
                  </TableRow>
                );
              })}

              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="py-10 text-center text-sm text-slate-500">
                    No projects found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-end gap-x-6 gap-y-2">
          <LegendItem colorClass="bg-red-500" label="GPT detected a potential error" />
          <LegendItem colorClass="bg-blue-500" label="Error reviewed and commented by official" />
          <LegendItem colorClass="bg-slate-300" label="No issues detected" />
        </div>
      </CardContent>
    </Card>
  );
}
