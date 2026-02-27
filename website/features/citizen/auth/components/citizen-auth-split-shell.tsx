"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/ui/utils";

type CitizenAuthSplitShellProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titleId: string;
  descriptionId: string;
  formPanel: ReactNode;
  brandPanel: ReactNode;
  formFirst?: boolean;
};

export default function CitizenAuthSplitShell({
  open,
  onOpenChange,
  titleId,
  descriptionId,
  formPanel,
  brandPanel,
  formFirst = true,
}: CitizenAuthSplitShellProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        overlayClassName="fixed inset-0 z-50 bg-[#001925]/65 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        className={cn(
          "max-w-[calc(100%-1.5rem)] border-0 bg-transparent p-0 shadow-none sm:max-w-[calc(100%-2.5rem)]",
          "w-full max-w-6xl"
        )}
      >
        <DialogTitle className="sr-only">Citizen Authentication</DialogTitle>
        <DialogDescription className="sr-only">
          Citizen sign in and sign up modal flow.
        </DialogDescription>
        <div className="relative mx-auto h-[min(88vh,720px)] w-full overflow-hidden rounded-2xl shadow-xl">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute right-6 top-6 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0EA5C6]/40"
            aria-label="Close authentication modal"
          >
            <X className="h-6 w-6" />
          </button>

          <div className="grid h-full md:grid-cols-2">
            <section className={cn("h-full", formFirst ? "order-1" : "order-2")}>
              {formPanel}
            </section>
            <section className={cn("h-full", formFirst ? "order-2" : "order-1")}>
              {brandPanel}
            </section>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
