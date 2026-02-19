"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle } from "lucide-react";
import type { FlaggedUserRowVM } from "@/lib/repos/usage-controls/types";

export default function BlockUserDialog({
  open,
  onOpenChange,
  user,
  durationValue,
  durationUnit,
  reason,
  onDurationValueChange,
  onDurationUnitChange,
  onReasonChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: FlaggedUserRowVM | null;
  durationValue: number;
  durationUnit: "days" | "weeks";
  reason: string;
  onDurationValueChange: (value: number) => void;
  onDurationUnitChange: (value: "days" | "weeks") => void;
  onReasonChange: (value: string) => void;
  onConfirm: () => void;
}) {
  if (!user) return null;

  const confirmDisabled = reason.trim().length < 10;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Temporarily Block Account</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-[13.5px] text-slate-700">
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-700">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5" />
              <div className="space-y-1 text-xs">
                <div>Temporary access restriction</div>
                <div>Block is time-limited — account auto-restores after expiration</div>
                <div>All actions are audit-logged with justification</div>
                <div>User data is preserved</div>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-slate-50 p-4 text-xs">
            <div className="font-medium text-slate-900">{user.name}</div>
            <div className="text-slate-500">
              {user.accountType} · Flagged {user.flags} times
            </div>
            <div className="text-slate-500">Last Flag: {user.reasonSummary}</div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-medium text-slate-700">Block Duration *</div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                min={1}
                value={durationValue}
                onChange={(e) => onDurationValueChange(Number(e.target.value))}
              />
              <Select
                value={durationUnit}
                onValueChange={(value) => onDurationUnitChange(value as "days" | "weeks")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="days">Days</SelectItem>
                  <SelectItem value="weeks">Weeks</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-medium text-slate-700">Reason for Block *</div>
            <Textarea
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              placeholder="Explain why this account needs to be blocked (e.g., spam, harassment, policy violations)..."
            />
          </div>

          <div className="rounded-lg bg-slate-50 px-4 py-3 text-[11px] text-slate-500">
            Audit Logging: All actions performed on this workflow case are automatically logged with
            timestamps, user information, and justification for compliance purposes.
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#0E5D6F] text-white hover:bg-[#0E5D6F]/90"
              onClick={onConfirm}
              disabled={confirmDisabled}
            >
              Confirm Block Account
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
