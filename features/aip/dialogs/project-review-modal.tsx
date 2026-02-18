"use client";

import * as React from "react";
import { AipProjectRow } from "../types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { peso } from "../utils";

function Panel({
  project,
}: {
  project: AipProjectRow;
}) {
  if (project.reviewStatus === "ai_flagged") {
    return (
      <div className="border border-red-200 bg-red-50 rounded-lg p-4 text-sm">
        <div className="font-semibold text-red-700">Detected Issues (AI)</div>
        <ul className="mt-2 list-disc pl-5 text-red-700/90 space-y-1">
          {project.aiIssues && project.aiIssues.length ? (
            project.aiIssues.map((issue, i) => <li key={i}>{issue}</li>)
          ) : (
            <li>No issues listed (check extraction)</li>
          )}
        </ul>
      </div>
    );
  }

  if (project.reviewStatus === "reviewed") {
    return (
      <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 text-sm">
        <div className="font-semibold text-blue-700">Official Review Comment</div>
        <p className="mt-2 text-blue-800">
          {project.officialComment ?? "No comment recorded."}
        </p>
      </div>
    );
  }

  return (
    <div className="border border-slate-200 bg-white rounded-lg p-4 text-sm text-slate-600">
      No issues detected.
    </div>
  );
}

export function ProjectReviewModal({
  open,
  onOpenChange,
  project,
  onSubmit,
  canComment = true,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  project: AipProjectRow | null;
  onSubmit: (payload: { comment: string; resolution: "disputed" | "confirmed" | "comment_only" }) => Promise<void>;
  canComment?: boolean;
}) {
  const [comment, setComment] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    // reset form on project change
    setComment("");
    setSubmitting(false);
  }, [project?.id]);

  if (!project) return null;

  // For red rows, you may want a "resolution" toggle later.
  // For now: treat submit as "disputed" for ai_flagged, otherwise "comment_only".
  const defaultResolution =
    project.reviewStatus === "ai_flagged" ? "disputed" : "comment_only";

  async function handleSubmit() {
    const trimmed = comment.trim();
    if (!trimmed) return;

    try {
      setSubmitting(true);
      await onSubmit({ comment: trimmed, resolution: defaultResolution });
      onOpenChange(false);
    } catch (error) {
      // Surface error to user (e.g., toast notification)
      console.error("Failed to submit review:", error);
      // Consider adding: toast.error("Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function renderField(label: string, value: React.ReactNode) {
    const display =
      value === null ||
      value === undefined ||
      (typeof value === "string" && value.trim().length === 0)
        ? "—"
        : value;

    return (
      <div className="flex gap-2">
        <dt className="w-56 text-slate-500">{label}</dt>
        <dd className="text-slate-800">{display}</dd>
      </div>
    );
  }

  const totalBudget = (() => {
    const psBudget = typeof project.psBudget === "number" ? project.psBudget : null;
    const mooeBudget = typeof project.mooeBudget === "number" ? project.mooeBudget : null;
    const coBudget = typeof project.coBudget === "number" ? project.coBudget : null;
    if (psBudget !== null && mooeBudget !== null && coBudget !== null) {
      return psBudget + mooeBudget + coBudget;
    }
    return project.amount;
  })();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[98vw] sm:max-w-250">
        <DialogHeader>
          <DialogTitle>
            {project.reviewStatus === "ai_flagged" ? "Error Review - Project Details" : "Project Details"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left: project info */}
          <div className="md:col-span-2 border border-slate-200 rounded-lg p-4">
            <div className="text-xs font-semibold text-slate-900">Project Information</div>

            <dl className="mt-3 space-y-2 text-xs">
              {renderField("AIP Reference Code", <span className="font-medium">{project.projectRefCode}</span>)}
              {renderField("Program/Project/Activity", project.aipDescription)}
              {renderField("Implementing Office/Department", project.implementingOffice)}
              {renderField("Starting Date", project.startDate)}
              {renderField("Completion Date", project.completionDate)}
              {renderField("Expected Outputs", project.expectedOutputs)}
              {renderField("Funding Source", project.fundingSource)}
              {renderField("PS", typeof project.psBudget === "number" ? peso(project.psBudget) : null)}
              {renderField("MOOE", typeof project.mooeBudget === "number" ? peso(project.mooeBudget) : null)}
              {renderField("CO", typeof project.coBudget === "number" ? peso(project.coBudget) : null)}
              {renderField("Total", <span className="font-medium">{peso(totalBudget)}</span>)}
              {renderField("Climate Change Adaptation", project.climateChangeAdaptation)}
              {renderField("Climate Change Mitigation", project.climateChangeMitigation)}
              {renderField("CC Typology Code", project.ccTypologyCode)}
              {renderField("PRM/NCR/LGU RM Objective-Results Indicator Code", project.rmObjectiveCode)}
              {renderField("Sector", project.sector)}
            </dl>
          </div>

          {/* Right: review panel + comment */}
          <div className="space-y-4 text-xs">
            <Panel project={project} />

            <div className="border border-slate-200 rounded-lg p-4">
              <div className="text-xs font-semibold text-slate-900">Official Comment</div>
              {!canComment ? (
                <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                  Feedback can only be added when the AIP status is For Revision.
                </div>
              ) : (
                <>
                  <p className="mt-1 text-xs text-slate-500">
                    Provide your comment to dispute, clarify, or confirm the AI-detected issues.
                  </p>

                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Enter your official comment here..."
                    className="mt-3 min-h-[110px]"
                  />

                  <Button
                    className="mt-3 w-full bg-[#022437] hover:bg-[#022437]/90"
                    onClick={handleSubmit}
                    disabled={submitting || !comment.trim()}
                  >
                    {submitting ? "Submitting..." : "Submit Review"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

