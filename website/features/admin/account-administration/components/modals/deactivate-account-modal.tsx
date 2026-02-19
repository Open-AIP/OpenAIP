"use client";

import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { AccountRecord } from "@/lib/repos/accounts/repo";

export default function DeactivateAccountModal({
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
          <DialogTitle>Deactivate Account</DialogTitle>
        </DialogHeader>

        {!account ? (
          <div className="text-sm text-slate-500">No account selected.</div>
        ) : (
          <div className="space-y-4">
            <Alert variant="destructive" className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                Are you sure you want to deactivate {`${account.fullName}'s`} account?
                This will block all access and the account cannot be used until reactivated.
              </AlertDescription>
            </Alert>

            <div className="flex items-center justify-center gap-3">
              <Button
                variant="destructive"
                className="w-48"
                onClick={onConfirm}
                disabled={loading}
              >
                Deactivate
              </Button>
              <Button
                variant="outline"
                className="w-48"
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
