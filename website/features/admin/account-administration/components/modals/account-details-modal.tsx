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
import { cn } from "@/lib/ui/utils";
import type { AccountRecord } from "@/lib/repos/accounts/repo";

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

function statusLongText(status: AccountRecord["status"]) {
  if (status === "active") return "Active - account can sign in.";
  return "Deactivated - account access is blocked.";
}

function formatDate(value: string | null) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
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
                    {account.status === "active" ? "Active" : "Deactivated"}
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
                icon={<Mail className="h-4 w-4" />}
                label="Email Address"
                value={account.email}
              />
              <DetailItem
                icon={<Calendar className="h-4 w-4" />}
                label="Account Created"
                value={formatDate(account.createdAt)}
              />
              <DetailItem
                icon={<Clock className="h-4 w-4" />}
                label="Last Login"
                value={formatDate(account.lastLoginAt)}
              />
              <DetailItem
                icon={<Clock className="h-4 w-4" />}
                label="Invite Sent"
                value={formatDate(account.invitedAt)}
              />
              <DetailItem
                icon={<Clock className="h-4 w-4" />}
                label="Invite Accepted"
                value={formatDate(account.emailConfirmedAt)}
              />
              <DetailItem
                icon={<Shield className="h-4 w-4" />}
                label="Account Status"
                value={statusLongText(account.status)}
              />
            </div>

            {account.status === "deactivated" ? (
              <InfoBox variant="neutral" title="Account Deactivated">
                This account is currently blocked from signing in.
              </InfoBox>
            ) : null}

            {account.invitationPending ? (
              <InfoBox variant="warning" title="Invite Pending">
                This user has not completed the invite flow yet.
              </InfoBox>
            ) : null}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
