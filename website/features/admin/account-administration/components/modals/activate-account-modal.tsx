"use client";

import { CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { AccountRecord } from "@/lib/repos/accounts/repo";

export default function ActivateAccountModal({
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
          <DialogTitle>
            Activate Account
          </DialogTitle>
        </DialogHeader>

        {!account ? (
          <div className="text-sm text-slate-500">No account selected.</div>
        ) : (
          <div className="space-y-4">
            <Alert className="border-sky-200 bg-sky-50 text-sky-900">
              <CheckCircle2 className="h-4 w-4 text-sky-700" />
              <AlertDescription className="text-sky-800">
                {`Activate ${account.fullName}'s account? They will be able to sign in again.`}
              </AlertDescription>
            </Alert>

            <div className="flex items-center justify-center gap-3">
              <Button
                className="w-56 bg-teal-700 hover:bg-teal-800"
                onClick={onConfirm}
                disabled={loading}
              >
                Activate
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

