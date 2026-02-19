"use client";

import {
  Edit3,
  EllipsisVertical,
  Eye,
  KeyRound,
  Mail,
  Trash2,
  UserCheck,
  UserX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AccountRecord } from "@/lib/repos/accounts/repo";

export default function AccountRowActions({
  account,
  onViewDetails,
  onEdit,
  onDeactivate,
  onDelete,
  onResetPassword,
  onResendInvite,
  onActivateOrReactivate,
}: {
  account: AccountRecord;
  onViewDetails: () => void;
  onEdit: () => void;
  onDeactivate: () => void;
  onDelete: () => void;
  onResetPassword: () => void;
  onResendInvite: () => void;
  onActivateOrReactivate: () => void;
}) {
  const isActive = account.status === "active";
  const isDeactivated = account.status === "deactivated";
  const isAdmin = account.role === "admin";
  const showInviteResend = account.canResendInvite;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Actions">
          <EllipsisVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            onViewDetails();
          }}
        >
          <Eye className="h-4 w-4" />
          View Details
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            onEdit();
          }}
        >
          <Edit3 className="h-4 w-4" />
          Edit Account
        </DropdownMenuItem>

        {isActive && !isAdmin ? (
          <DropdownMenuItem
            variant="destructive"
            onSelect={(e) => {
              e.preventDefault();
              onDeactivate();
            }}
          >
            <UserX className="h-4 w-4" />
            Deactivate
          </DropdownMenuItem>
        ) : null}

        {isDeactivated ? (
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              onActivateOrReactivate();
            }}
          >
            <UserCheck className="h-4 w-4" />
            Activate
          </DropdownMenuItem>
        ) : null}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            onResetPassword();
          }}
        >
          <KeyRound className="h-4 w-4" />
          Reset Password
        </DropdownMenuItem>

        {showInviteResend ? (
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              onResendInvite();
            }}
          >
            <Mail className="h-4 w-4" />
            Resend Invite
          </DropdownMenuItem>
        ) : null}

        {!isAdmin ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onSelect={(e) => {
                e.preventDefault();
                onDelete();
              }}
            >
              <Trash2 className="h-4 w-4" />
              Delete Account
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

