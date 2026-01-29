/**
 * Upload AIP Dialog Component
 * 
 * Modal dialog for uploading new Annual Investment Plan documents.
 * Validates file type (PDF only), file size (max 10MB), and required year selection.
 * Provides user-friendly error messages and file preview.
 * 
 * @module feature/aips/upload-aip-dialog
 */

"use client";

import * as React from "react";
import { X, Upload } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Props for UploadAipDialog component
 */
type Props = {
  /** Dialog open state */
  open: boolean;
  /** Callback to control dialog open state */
  onOpenChange: (open: boolean) => void;
  /** Callback when upload is submitted */
  onSubmit?: (payload: { file: File; year: number }) => void;
  /** Callback when upload succeeds with new AIP ID */
  onSuccess?: (aipId: string) => void;
  /** Administrative scope for context */
  scope?: "city" | "barangay";
};

/** Maximum allowed file size in bytes (10MB) */
const MAX_BYTES = 10 * 1024 * 1024;

/**
 * Builds an array of years for selection
 * @param count - Number of years to generate
 * @returns Array of year numbers
 */
function buildYears(count = 7) {
  const now = new Date().getFullYear();
  // Ex: current year -2 to +4 (adjust as you want)
  const start = now - 2;
  return Array.from({ length: count }, (_, i) => start + i);
}

/**
 * UploadAipDialog Component
 * 
 * Provides a modal interface for uploading AIP PDF documents.
 * Features:
 * - PDF file validation (type and size)
 * - Year selection
 * - Error messaging
 * - Form reset on close
 * - Responsive layout
 * 
 * Validation rules:
 * - File must be PDF format
 * - File size must not exceed 10MB
 * - Year selection is required
 * 
 * @param open - Controls dialog visibility
 * @param onOpenChange - Handler for dialog state changes
 * @param onSubmit - Handler called with file and year on successful submission
 * @param scope - Administrative scope for display purposes
 */
export default function UploadAipDialog({ 
  open, 
  onOpenChange, 
  onSubmit, 
  onSuccess,
  scope = "barangay" 
}: Props) {
  const fileRef = React.useRef<HTMLInputElement | null>(null);

  const [file, setFile] = React.useState<File | null>(null);
  const [year, setYear] = React.useState<string>("");
  const [error, setError] = React.useState<string>("");

  const years = React.useMemo(() => buildYears(7).sort((a, b) => b - a), []);

  const scopeLabel = scope === "city" ? "city" : "barangay";

  function reset() {
    setFile(null);
    setYear("");
    setError("");
    if (fileRef.current) fileRef.current.value = "";
  }

  function validate(f: File | null, y: string) {
    if (!f) return "Please upload an AIP PDF file.";
    if (f.type !== "application/pdf") return "PDF only. Please upload a .pdf file.";
    if (f.size > MAX_BYTES) return "File too large. Maximum file size is 10MB.";
    if (!y) return "Please select the AIP year.";
    return "";
  }

  function onPickFile(next: File | null) {
    setError("");
    if (!next) {
      setFile(null);
      return;
    }
    const msg = validate(next, year);
    if (msg && !msg.includes("year")) {
      setFile(null);
      setError(msg);
      return;
    }
    setFile(next);
  }

  function submit() {
    const msg = validate(file, year);
    if (msg) {
      setError(msg);
      return;
    }

    // Generate mock AIP ID based on file and year
    const mockId = `aip-${year}-${file!.name.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 20)}-${Date.now()}`;

    onSubmit?.({ file: file!, year: Number(year) });
    
    // Close dialog and call success callback with mock ID
    onOpenChange(false);
    reset();
    
    // Trigger navigation after dialog closes
    setTimeout(() => {
      onSuccess?.(mockId);
    }, 100);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent className="sm:max-w-[720px] p-0 overflow-hidden" showCloseButton={false}>
        {/* Header */}
        <div className="p-8 pb-4">
          <DialogHeader className="space-y-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <DialogTitle className="text-3xl font-bold text-slate-900">
                  Upload AIP
                </DialogTitle>
                <DialogDescription className="text-base text-slate-500 mt-2">
                  Upload a new Annual Investment Plan document for your {scopeLabel}
                </DialogDescription>
              </div>

              <DialogClose asChild>
                <button
                  className="rounded-full p-2 hover:bg-slate-100 text-slate-500"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </DialogClose>
            </div>
          </DialogHeader>
        </div>

        {/* Body */}
        <div className="px-8 pb-6 space-y-6">
          {/* File */}
          <div className="space-y-3">
            <Label className="text-base font-medium text-slate-900">
              AIP Document (PDF only) <span className="text-red-500">*</span>
            </Label>

            <input
              ref={fileRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
            />

            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className={[
                "w-full rounded-xl border-2 border-slate-200 bg-white",
                "px-6 py-10 text-center transition",
                "hover:bg-slate-50",
                error && !file ? "border-red-300" : "",
              ].join(" ")}
            >
              <div className="mx-auto flex w-full max-w-md flex-col items-center gap-3">
                <div className="h-14 w-14 rounded-2xl border border-slate-200 bg-slate-50 grid place-items-center">
                  <Upload className="h-7 w-7 text-slate-400" />
                </div>

                {file ? (
                  <>
                    <div className="text-lg font-medium text-slate-700">
                      {file.name}
                    </div>
                    <div className="text-sm text-slate-400">
                      Click to change file
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-xl font-medium text-slate-700">
                      Click to upload PDF file
                    </div>
                    <div className="text-base text-slate-400">
                      Maximum file size: 10MB
                    </div>
                  </>
                )}
              </div>
            </button>
          </div>

          {/* Year */}
          <div className="space-y-3">
            <Label className="text-base font-medium text-slate-900">
              AIP Year <span className="text-red-500">*</span>
            </Label>

            <Select value={year} onValueChange={(v) => { setYear(v); setError(""); }}>
              <SelectTrigger className="h-12 bg-slate-50 border-slate-200">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Error */}
          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-8 py-5">
          <div className="flex justify-end gap-3">
            <DialogClose asChild>
              <Button variant="outline" className="h-11 px-8">
                Cancel
              </Button>
            </DialogClose>

            <Button
              className="h-11 px-8 bg-[#022437] hover:bg-[#022437]/90"
              onClick={submit}
            >
              Upload AIP
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
