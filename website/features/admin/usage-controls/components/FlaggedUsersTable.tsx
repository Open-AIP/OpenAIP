"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MoreHorizontal, ShieldAlert } from "lucide-react";
import type { FlaggedUserRowVM } from "@/lib/repos/usage-controls/types";

const statusBadgeClass = (status: FlaggedUserRowVM["status"]) =>
  status === "Blocked"
    ? "bg-rose-50 text-rose-700 border-rose-200"
    : "bg-emerald-50 text-emerald-700 border-emerald-200";

export default function FlaggedUsersTable({
  rows,
  onViewAudit,
  onBlock,
  onUnblock,
}: {
  rows: FlaggedUserRowVM[];
  onViewAudit: (row: FlaggedUserRowVM) => void;
  onBlock: (row: FlaggedUserRowVM) => void;
  onUnblock: (row: FlaggedUserRowVM) => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50 text-[11px] uppercase text-slate-500">
            <TableHead className="p-4">User Name</TableHead>
            <TableHead className="p-4">Account Type</TableHead>
            <TableHead className="p-4">Reason Summary</TableHead>
            <TableHead className="p-4">Flags</TableHead>
            <TableHead className="p-4">Last Flagged</TableHead>
            <TableHead className="p-4">Status</TableHead>
            <TableHead className="p-4 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.userId} className="text-[13.5px]">
              <TableCell className="p-4 align-top">
                <div className="font-medium text-slate-900">{row.name}</div>
                {row.status === "Blocked" && row.blockedUntil && (
                  <div className="text-xs text-rose-600">
                    Blocked until {row.blockedUntil}
                  </div>
                )}
              </TableCell>
              <TableCell className="p-4 text-slate-600">{row.accountType}</TableCell>
              <TableCell className="p-4 text-slate-600">{row.reasonSummary}</TableCell>
              <TableCell className="p-4">
                <span className={row.flags >= 5 ? "text-rose-600 font-semibold" : ""}>
                  {row.flags}
                </span>
              </TableCell>
              <TableCell className="p-4 text-slate-600">{row.lastFlagged}</TableCell>
              <TableCell className="p-4">
                <Badge variant="outline" className={statusBadgeClass(row.status)}>
                  {row.status}
                </Badge>
              </TableCell>
              <TableCell className="p-4 text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onSelect={(event) => {
                        event.preventDefault();
                        onViewAudit(row);
                      }}
                    >
                      <ShieldAlert className="mr-2 h-4 w-4 text-slate-500" />
                      View Audit by User
                    </DropdownMenuItem>
                    {row.status === "Blocked" ? (
                      <DropdownMenuItem
                        onSelect={(event) => {
                          event.preventDefault();
                          onUnblock(row);
                        }}
                        className="text-emerald-600"
                      >
                        Unblock
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        onSelect={(event) => {
                          event.preventDefault();
                          onBlock(row);
                        }}
                        className="text-rose-600"
                      >
                        Temporarily Block
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}

          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="py-10 text-center text-slate-500">
                No flagged users found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
