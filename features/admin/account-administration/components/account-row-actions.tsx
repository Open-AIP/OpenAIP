"use client";

import {
  Ban,
  EllipsisVertical,
  Eye,
  KeyRound,
  LogOut,
  PauseCircle,
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
  onDeactivate,
  onSuspend,
  onResetPassword,
  onForceLogout,
  onActivateOrReactivate,
}: {
  account: AccountRecord;
  onViewDetails: () => void;
  onDeactivate: () => void;
  onSuspend: () => void;
  onResetPassword: () => void;
  onForceLogout: () => void;
  onActivateOrReactivate: () => void;
}) {
  const isActive = account.status === "active";
  const isDeactivated = account.status === "deactivated";
  const isSuspended = account.status === "suspended";

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

        {isActive ? (
          <>
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

            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                onSuspend();
              }}
            >
              <PauseCircle className="h-4 w-4" />
              Suspend
            </DropdownMenuItem>
          </>
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

        {isSuspended ? (
          <>
            <DropdownMenuItem
              variant="destructive"
              onSelect={(e) => {
                e.preventDefault();
                onDeactivate();
              }}
            >
              <Ban className="h-4 w-4" />
              Deactivate
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                onActivateOrReactivate();
              }}
            >
              <UserCheck className="h-4 w-4" />
              Reactivate
            </DropdownMenuItem>
          </>
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

        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            onForceLogout();
          }}
        >
          <LogOut className="h-4 w-4" />
          Force Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

