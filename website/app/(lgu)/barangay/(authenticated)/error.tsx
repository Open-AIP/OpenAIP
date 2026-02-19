"use client";

import { Button } from "@/components/ui/button";

export default function BarangayAuthenticatedError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="space-y-4 rounded-xl border border-rose-200 bg-rose-50 p-6">
      <h2 className="text-lg font-semibold text-rose-900">Barangay page failed to load</h2>
      <p className="text-sm text-rose-700">{error.message || "Unexpected route failure."}</p>
      <Button type="button" variant="outline" onClick={reset}>
        Retry
      </Button>
    </div>
  );
}

