"use client";

import type { ReactNode } from "react";
import {
  Building2,
  Calendar,
  Clock,
  Mail,
  Shield,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { AccountRecord } from "@/lib/repos/accounts/repo";

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

function statusLongText(status: AccountRecord["status"]) {
  if (status === "active") return "Active - Full system access";
  if (status === "suspended") return "Suspended - Access temporarily blocked";
  return "Deactivated - Account disabled";
}

function InfoBox({
  variant,
  title,
  children,
}: {
  variant: "neutral" | "warning";
  title: string;
  children: ReactNode;
}) {
  const cls =
    variant === "warning"
      ? "border-amber-200 bg-amber-50 text-amber-900"
      : "border-slate-200 bg-slate-50 text-slate-700";
  return (
      <div className={cn("rounded-lg border p-4 text-sm", cls)}>
      <div className="font-medium">{title}</div>
      <div className="mt-1 text-xs leading-relaxed opacity-90">{children}</div>
    </div>
  );
}

function DetailItem({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 text-slate-500">{icon}</div>
      <div>
        <div className="text-xs text-slate-500">{label}</div>
        <div className="text-sm text-slate-900 mt-1">{value}</div>
      </div>
    </div>
  );
}

export default function AccountDetailsModal({
  open,
  onOpenChange,
  account,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: AccountRecord | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Account Details</DialogTitle>
        </DialogHeader>

        {!account ? (
          <div className="text-sm text-slate-500">No account selected.</div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-teal-700 grid place-items-center">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-lg font-semibold text-slate-900">
                  {account.fullName}
                </div>
                <div className="text-sm text-slate-500">{account.email}</div>
                <div className="mt-2">
                  <Badge
                    variant="outline"
                    className={cn("rounded-full px-3 py-1 text-[11px]", statusBadgeClass(account.status))}
                  >
                    {statusLabel(account.status)}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid gap-5 md:grid-cols-2">
              <DetailItem
                icon={<Shield className="h-4 w-4" />}
                label="Role"
                value={roleLabel(account.role)}
              />
              <DetailItem
                icon={<Building2 className="h-4 w-4" />}
                label="LGU Assignment"
                value={account.lguAssignment}
              />
              <DetailItem
                icon={<Building2 className="h-4 w-4" />}
                label="Office / Department"
                value={account.officeDepartment}
              />
              <DetailItem
                icon={<Mail className="h-4 w-4" />}
                label="Email Address"
                value={account.email}
              />
              <DetailItem
                icon={<Calendar className="h-4 w-4" />}
                label="Account Created"
                value={account.createdDate}
              />
              <DetailItem
                icon={<Clock className="h-4 w-4" />}
                label="Last Login"
                value={account.lastLogin}
              />
              <DetailItem
                icon={<Shield className="h-4 w-4" />}
                label="Account Status"
                value={statusLongText(account.status)}
              />
            </div>

            {account.status === "deactivated" ? (
              <InfoBox
                variant="neutral"
                title="Account Deactivated"
              >
                This account has been permanently deactivated and cannot be used to access the system.
              </InfoBox>
            ) : null}

            {account.status === "suspended" ? (
              <InfoBox
                variant="warning"
                title="Suspension Information"
              >
                This account has been suspended. The user cannot access the system until the suspension is lifted.
              </InfoBox>
            ) : null}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
