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
import type { AccountRecord } from "@/lib/repos/accounts/repo";
import { cn } from "@/ui/utils";
import AccountRowActions from "./account-row-actions";

function roleLabel(role: AccountRecord["role"]) {
  if (role === "barangay_official") return "Barangay Official";
  if (role === "city_official") return "City Official";
  return "Citizen";
}

function statusBadgeClass(status: AccountRecord["status"]) {
  if (status === "active") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "suspended") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-slate-200 bg-slate-100 text-slate-600";
}

function statusLabel(status: AccountRecord["status"]) {
  if (status === "active") return "Active";
  if (status === "suspended") return "Suspended";
  return "Deactivated";
}

export default function AccountsTable({
  tab,
  rows,
  onViewDetails,
  onDeactivate,
  onSuspend,
  onResetPassword,
  onForceLogout,
  onActivateOrReactivate,
}: {
  tab: AccountRecord["tab"];
  rows: AccountRecord[];
  onViewDetails: (id: string) => void;
  onDeactivate: (id: string) => void;
  onSuspend: (id: string) => void;
  onResetPassword: (id: string) => void;
  onForceLogout: (id: string) => void;
  onActivateOrReactivate: (id: string) => void;
}) {
  const emailHeader = tab === "officials" ? "OFFICIAL EMAIL" : "EMAIL";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white m-5">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <TableHead className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
                Full Name
              </TableHead>
              <TableHead className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
                {emailHeader}
              </TableHead>
              <TableHead className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
                Role
              </TableHead>
              <TableHead className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
                LGU Assignment
              </TableHead>
              <TableHead className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
                Office / Department
              </TableHead>
              <TableHead className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
                Status
              </TableHead>
              <TableHead className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
                Last Login
              </TableHead>
              <TableHead className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
                Created Date
              </TableHead>
              <TableHead className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id} className="hover:bg-slate-50">
                <TableCell className="text-sm text-slate-900 font-medium">
                  {row.fullName}
                </TableCell>
                <TableCell className="text-sm text-slate-600">{row.email}</TableCell>
                <TableCell className="text-sm text-slate-700">
                  {roleLabel(row.role)}
                </TableCell>
                <TableCell className="text-sm text-slate-700">{row.lguAssignment}</TableCell>
                <TableCell className="text-sm text-slate-700">
                  {row.officeDepartment}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn("rounded-full px-3 py-1 text-[11px]", statusBadgeClass(row.status))}
                  >
                    {statusLabel(row.status)}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-slate-700">{row.lastLogin}</TableCell>
                <TableCell className="text-sm text-slate-700 tabular-nums">
                  {row.createdDate}
                </TableCell>
                <TableCell className="text-right">
                  <AccountRowActions
                    account={row}
                    onViewDetails={() => onViewDetails(row.id)}
                    onDeactivate={() => onDeactivate(row.id)}
                    onSuspend={() => onSuspend(row.id)}
                    onResetPassword={() => onResetPassword(row.id)}
                    onForceLogout={() => onForceLogout(row.id)}
                    onActivateOrReactivate={() => onActivateOrReactivate(row.id)}
                  />
                </TableCell>
              </TableRow>
            ))}

            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-12 text-center text-sm text-slate-500">
                  No accounts found.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
