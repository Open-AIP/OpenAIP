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
  if (role === "admin") return "Admin";
  if (role === "barangay_official") return "Barangay Official";
  if (role === "city_official") return "City Official";
  if (role === "municipal_official") return "Municipal Official";
  return "Citizen";
}

function statusBadgeClass(status: AccountRecord["status"]) {
  if (status === "active") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  return "border-slate-200 bg-slate-100 text-slate-600";
}

function statusLabel(status: AccountRecord["status"]) {
  if (status === "active") return "Active";
  return "Deactivated";
}

function invitationBadgeClass(pending: boolean) {
  if (pending) return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-slate-200 bg-slate-100 text-slate-600";
}

function invitationLabel(pending: boolean) {
  return pending ? "Pending Invite" : "Accepted";
}

function formatDateTime(value: string | null) {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

export default function AccountsTable({
  rows,
  onViewDetails,
  onEdit,
  onDeactivate,
  onDelete,
  onResetPassword,
  onResendInvite,
  onActivateOrReactivate,
}: {
  rows: AccountRecord[];
  onViewDetails: (id: string) => void;
  onEdit: (id: string) => void;
  onDeactivate: (id: string) => void;
  onDelete: (id: string) => void;
  onResetPassword: (id: string) => void;
  onResendInvite: (id: string) => void;
  onActivateOrReactivate: (id: string) => void;
}) {
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
                Email
              </TableHead>
              <TableHead className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
                Role
              </TableHead>
              <TableHead className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
                LGU Assignment
              </TableHead>
              <TableHead className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
                Status
              </TableHead>
              <TableHead className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
                Invite Status
              </TableHead>
              <TableHead className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
                Last Login
              </TableHead>
              <TableHead className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
                Created
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
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn("rounded-full px-3 py-1 text-[11px]", statusBadgeClass(row.status))}
                  >
                    {statusLabel(row.status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn(
                      "rounded-full px-3 py-1 text-[11px]",
                      invitationBadgeClass(row.invitationPending)
                    )}
                  >
                    {invitationLabel(row.invitationPending)}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-slate-700">
                  {formatDateTime(row.lastLoginAt)}
                </TableCell>
                <TableCell className="text-sm text-slate-700 tabular-nums">
                  {formatDate(row.createdAt)}
                </TableCell>
                <TableCell className="text-right">
                  <AccountRowActions
                    account={row}
                    onViewDetails={() => onViewDetails(row.id)}
                    onEdit={() => onEdit(row.id)}
                    onDeactivate={() => onDeactivate(row.id)}
                    onDelete={() => onDelete(row.id)}
                    onResetPassword={() => onResetPassword(row.id)}
                    onResendInvite={() => onResendInvite(row.id)}
                    onActivateOrReactivate={() => onActivateOrReactivate(row.id)}
                  />
                </TableCell>
              </TableRow>
            ))}

            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-12 text-center text-sm text-slate-500">
                  No accounts found for the selected filters.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
