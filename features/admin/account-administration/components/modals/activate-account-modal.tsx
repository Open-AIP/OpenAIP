"use client";

import { CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { AccountRecord } from "@/lib/repos/accounts/repo";

function modalTitleForStatus(status: AccountRecord["status"]) {
  if (status === "suspended") return "Reactivate Account";
  return "Activate Account";
}

function messageForStatus(account: AccountRecord) {
  if (account.status === "suspended") {
    return `Reactivate ${account.fullName}'s account? This will restore full access to the system.`;
  }
  return `Activate ${account.fullName}'s account? They will be able to access the system.`;
}

export default function ActivateAccountModal({
  open,
  onOpenChange,
  account,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: AccountRecord | null;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {account ? modalTitleForStatus(account.status) : "Activate Account"}
          </DialogTitle>
        </DialogHeader>

        {!account ? (
          <div className="text-sm text-slate-500">No account selected.</div>
        ) : (
          <div className="space-y-4">
            <Alert className="border-sky-200 bg-sky-50 text-sky-900">
              <CheckCircle2 className="h-4 w-4 text-sky-700" />
              <AlertDescription className="text-sky-800">
                {messageForStatus(account)}
              </AlertDescription>
            </Alert>

            <div className="flex items-center justify-center gap-3">
              <Button className="w-56 bg-teal-700 hover:bg-teal-800" onClick={onConfirm}>
                Activate
              </Button>
              <Button variant="outline" className="w-56" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

