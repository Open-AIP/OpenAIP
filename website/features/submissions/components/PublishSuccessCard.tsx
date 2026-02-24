import { ArrowLeft, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export function PublishSuccessCard({
  barangayName,
  onBackToSubmissions,
  onViewPublishedAip,
}: {
  barangayName?: string | null;
  onBackToSubmissions: () => void;
  onViewPublishedAip: () => void;
}) {
  const barangayLabel = barangayName ? `Brgy. ${barangayName}` : "the barangay";

  return (
    <div className="grid place-items-center py-20">
      <div className="w-full max-w-4xl rounded-2xl border border-emerald-200 bg-white px-10 py-16">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-emerald-50">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <div className="text-3xl font-semibold text-slate-900">AIP Published Successfully!</div>
          <div className="max-w-xl text-sm text-slate-600">
            The Annual Investment Plan for {barangayLabel} has been published and is now available
            for viewing.
          </div>
          <div className="max-w-xl text-xs text-slate-500">
            Search indexing has started and may take a short while to complete.
          </div>
          <div className="mt-2 flex items-center gap-3">
            <Button variant="outline" className="gap-2" onClick={onBackToSubmissions}>
              <ArrowLeft className="h-4 w-4" />
              Back to Submissions
            </Button>
            <Button
              className="gap-2 bg-teal-700 hover:bg-teal-800"
              onClick={onViewPublishedAip}
            >
              View Published AIP
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

