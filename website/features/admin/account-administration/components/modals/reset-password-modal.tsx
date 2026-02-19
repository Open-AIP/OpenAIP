"use client";

import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { AccountRecord } from "@/lib/repos/accounts/repo";

export default function ResetPasswordModal({
  open,
  onOpenChange,
  account,
  onConfirm,
  loading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: AccountRecord | null;
  onConfirm: () => void;
  loading: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
        </DialogHeader>

        {!account ? (
          <div className="text-sm text-slate-500">No account selected.</div>
        ) : (
          <div className="space-y-4">
            <Alert className="border-amber-200 bg-amber-50 text-amber-900">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                Send a password reset link to {account.email}? The user will receive instructions to set a new password.
              </AlertDescription>
            </Alert>

            <div className="flex items-center justify-center gap-3">
              <Button
                className="w-56 bg-teal-700 hover:bg-teal-800"
                onClick={onConfirm}
                disabled={loading}
              >
                Send Reset Link
              </Button>
              <Button
                variant="outline"
                className="w-56"
                onClick={() => onOpenChange(false)}
                disabled={loading}
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

