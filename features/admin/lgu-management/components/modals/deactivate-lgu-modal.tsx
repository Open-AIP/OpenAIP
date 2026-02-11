"use client";

import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { LguRecord } from "@/lib/repos/lgu/repo";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lgu: LguRecord | null;
  onConfirm: (id: string) => Promise<void>;
};

export default function DeactivateLguModal({
  open,
  onOpenChange,
  lgu,
  onConfirm,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Deactivate LGU</DialogTitle>
        </DialogHeader>

        {!lgu ? (
          <div className="text-sm text-slate-500">No LGU selected.</div>
        ) : (
          <div className="space-y-4">
            <Alert variant="destructive" className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                Deactivate {lgu.name}? This LGU will be hidden from dashboards
                and cannot submit AIPs. Historical records will be preserved.
              </AlertDescription>
            </Alert>

            <div className="flex items-center justify-center gap-3">
              <Button
                variant="destructive"
                className="w-48"
                onClick={async () => {
                  await onConfirm(lgu.id);
                  onOpenChange(false);
                }}
              >
                Deactivate
              </Button>
              <Button
                variant="outline"
                className="w-48"
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

