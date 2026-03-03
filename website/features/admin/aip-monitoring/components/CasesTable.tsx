"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Archive,
  EllipsisVertical,
  RefreshCcw,
  Trash2,
  UserX,
} from "lucide-react";
import type { CaseRow, CaseType } from "../types/monitoring.types";
import { cn } from "@/lib/ui/utils";

function caseBadgeClass(caseType: CaseType) {
  switch (caseType) {
    case "Duplicate":
      return "bg-sky-50 text-sky-700 border-sky-200";
    case "Stuck":
      return "bg-amber-50 text-amber-800 border-amber-200";
    case "Locked":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "Archived":
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
}

function durationClass(days: number) {
  if (days >= 60) return "text-rose-600 font-semibold";
  if (days >= 30) return "text-amber-600 font-semibold";
  return "text-slate-700";
}

export default function CasesTable({
  rows,
  onForceUnclaim,
  onCancelSubmission,
  onArchiveSubmission,
  onUnarchiveSubmission,
}: {
  rows: CaseRow[];
  onForceUnclaim: (id: string) => void;
  onCancelSubmission: (id: string) => void;
  onArchiveSubmission: (id: string) => void;
  onUnarchiveSubmission: (id: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white m-5">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <TableHead className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
                Year
              </TableHead>
              <TableHead className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
                LGU
              </TableHead>
              <TableHead className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
                Case Type
              </TableHead>
              <TableHead className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
                Duration (Days)
              </TableHead>
              <TableHead className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
                Claimed By
              </TableHead>
              <TableHead className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
                Last Updated
              </TableHead>
              <TableHead className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id} className="hover:bg-slate-50">
                <TableCell className="text-[13.5px] text-slate-900 font-medium">
                  {row.year}
                </TableCell>
                <TableCell className="text-[13.5px] text-slate-700">{row.lguName}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn(
                      "rounded-full px-3 py-1 text-[11px]",
                      caseBadgeClass(row.caseType)
                    )}
                  >
                    {row.caseType}
                  </Badge>
                </TableCell>
                <TableCell className={cn("text-[13.5px]", durationClass(row.durationDays))}>
                  {row.durationDays}
                </TableCell>
                <TableCell className="text-[13.5px] text-slate-700">
                  {row.claimedBy ?? "—"}
                </TableCell>
                <TableCell className="text-[13.5px] text-slate-700">
                  {row.lastUpdated}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" aria-label="Actions">
                        <EllipsisVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault();
                          onForceUnclaim(row.id);
                        }}
                      >
                        <UserX className="h-4 w-4" />
                        Force-Unclaim
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault();
                          onCancelSubmission(row.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        Cancel Submission
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      {!row.isArchived ? (
                        <DropdownMenuItem
                          onSelect={(e) => {
                            e.preventDefault();
                            onArchiveSubmission(row.id);
                          }}
                        >
                          <Archive className="h-4 w-4" />
                          Archive Submission
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onSelect={(e) => {
                            e.preventDefault();
                            onUnarchiveSubmission(row.id);
                          }}
                        >
                          <RefreshCcw className="h-4 w-4" />
                          Unarchive Submission
                        </DropdownMenuItem>
                      )}

                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}

            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-sm text-slate-500">
                  No cases found.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
