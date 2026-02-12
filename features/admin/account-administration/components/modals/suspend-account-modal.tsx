"use client";

import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AccountRecord } from "@/lib/repos/accounts/repo";

export default function SuspendAccountModal({
  open,
  onOpenChange,
  account,
  reason,
  onReasonChange,
  endDate,
  onEndDateChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: AccountRecord | null;
  reason: string;
  onReasonChange: (value: string) => void;
  endDate: string;
  onEndDateChange: (value: string) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Suspend Account</DialogTitle>
        </DialogHeader>

        {!account ? (
          <div className="text-sm text-slate-500">No account selected.</div>
        ) : (
          <div className="space-y-4">
            <Alert className="border-amber-200 bg-amber-50 text-amber-900">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                Warning: Account Access Will Be Blocked
                <div className="mt-2 text-sm">
                  User <strong>{account.fullName}</strong> will not be able to log in or access the system during the suspension period. The suspension reason will be visible to the user.
                </div>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>
                Suspension Reason <span className="text-rose-600">*</span>
              </Label>
              <Textarea
                value={reason}
                onChange={(e) => onReasonChange(e.target.value)}
                placeholder="Enter the reason for suspension (visible to user)"
                className="min-h-[120px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="suspension-end-date">Suspension End Date (Optional)</Label>
              <Input
                id="suspension-end-date"
                type="date"
                value={endDate}
                onChange={(e) => onEndDateChange(e.target.value)}
                className="h-11"
                min={new Date().toISOString().split('T')[0]}
              />
              <div className="text-xs text-slate-500">
                Leave empty for indefinite suspension
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="destructive"
                className="w-56"
                onClick={onConfirm}
                disabled={!reason.trim()}
              >
                Confirm Suspension
              </Button>
              <Button
                variant="outline"
                className="w-56"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

