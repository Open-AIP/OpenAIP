"use client";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { LguRecord } from "@/lib/repos/lgu/repo";
import { cn } from "@/ui/utils";
import LguRowActions from "./lgu-row-actions";

function statusBadgeClass(status: LguRecord["status"]) {
  if (status === "active") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  return "border-slate-200 bg-slate-100 text-slate-600";
}

function lguTypeLabel(type: LguRecord["type"]) {
  if (type === "region") return "Region";
  if (type === "province") return "Province";
  if (type === "city") return "City";
  if (type === "municipality") return "Municipality";
  return "Barangay";
}

export default function LguTable({
  rows,
  onEdit,
  onDeactivate,
  onActivate,
}: {
  rows: LguRecord[];
  onEdit: (id: string) => void;
  onDeactivate: (id: string) => void;
  onActivate: (id: string) => void;
}) {
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50 hover:bg-slate-50">
            <TableHead className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
              Type
            </TableHead>
            <TableHead className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
              Name
            </TableHead>
            <TableHead className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
              PSGC Code
            </TableHead>
            <TableHead className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
              Parent LGU
            </TableHead>
            <TableHead className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
              Status
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
          {rows.map((lgu) => (
            <TableRow key={lgu.id} className="hover:bg-slate-50">
              <TableCell className="text-sm text-slate-700">
                {lguTypeLabel(lgu.type)}
              </TableCell>
              <TableCell className="text-sm text-slate-900 font-medium">
                {lgu.name}
              </TableCell>
              <TableCell className="text-sm text-slate-700">{lgu.code}</TableCell>
              <TableCell className="text-sm text-slate-700">
                {lgu.parentName ?? "-"}
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={cn(
                    "rounded-full px-3 py-1 text-[11px]",
                    statusBadgeClass(lgu.status)
                  )}
                >
                  {lgu.status === "active" ? "Active" : "Deactivated"}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-slate-700 tabular-nums">
                {lgu.updatedAt}
              </TableCell>
              <TableCell className="text-right">
                <LguRowActions
                  lgu={lgu}
                  onEdit={() => onEdit(lgu.id)}
                  onDeactivate={() => onDeactivate(lgu.id)}
                  onActivate={() => onActivate(lgu.id)}
                />
              </TableCell>
            </TableRow>
          ))}

          {rows.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={7}
                className="py-12 text-center text-sm text-slate-500"
              >
                No LGUs found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
