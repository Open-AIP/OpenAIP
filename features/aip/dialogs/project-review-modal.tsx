"use client";

import * as React from "react";
import type { SubmitReviewProjectUpdates } from "@/lib/repos/aip/repo";
import { Input } from "@/components/ui/input";
import { AipProjectRow } from "../types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { peso, SECTOR_TABS } from "../utils";

const SECTOR_OPTIONS = [...SECTOR_TABS, "Unknown"] as const;

type ProjectEditFormState = {
  projectRefCode: string;
  aipDescription: string;
  implementingOffice: string;
  startDate: string;
  completionDate: string;
  expectedOutputs: string;
  fundingSource: string;
  psBudget: string;
  mooeBudget: string;
  coBudget: string;
  climateChangeAdaptation: string;
  climateChangeMitigation: string;
  ccTypologyCode: string;
  rmObjectiveCode: string;
  sector: SubmitReviewProjectUpdates["sector"];
};

export type ProjectReviewSubmitPayload = {
  comment: string;
  projectUpdates: SubmitReviewProjectUpdates;
};

function toInputValue(value: string | null | undefined) {
  return value ?? "";
}

function toNullableString(value: string) {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function parseBudget(value: string): { value: number | null; valid: boolean } {
  const trimmed = value.trim();
  if (!trimmed) return { value: null, valid: true };
  const parsed = Number(trimmed.replace(/,/g, ""));
  if (!Number.isFinite(parsed) || parsed < 0) return { value: null, valid: false };
  return { value: parsed, valid: true };
}

function autoResizeTextarea(textarea: HTMLTextAreaElement | null) {
  if (!textarea) return;
  textarea.style.height = "0px";
  textarea.style.height = `${Math.max(textarea.scrollHeight, 28)}px`;
}

function toEditForm(project: AipProjectRow): ProjectEditFormState {
  return {
    projectRefCode: project.projectRefCode,
    aipDescription: project.aipDescription,
    implementingOffice: toInputValue(project.implementingOffice),
    startDate: toInputValue(project.startDate),
    completionDate: toInputValue(project.completionDate),
    expectedOutputs: toInputValue(project.expectedOutputs),
    fundingSource: toInputValue(project.fundingSource),
    psBudget: typeof project.psBudget === "number" ? String(project.psBudget) : "",
    mooeBudget: typeof project.mooeBudget === "number" ? String(project.mooeBudget) : "",
    coBudget: typeof project.coBudget === "number" ? String(project.coBudget) : "",
    climateChangeAdaptation: toInputValue(project.climateChangeAdaptation),
    climateChangeMitigation: toInputValue(project.climateChangeMitigation),
    ccTypologyCode: toInputValue(project.ccTypologyCode),
    rmObjectiveCode: toInputValue(project.rmObjectiveCode),
    sector: project.sector,
  };
}

function Panel({
  project,
}: {
  project: AipProjectRow;
}) {
  if (project.reviewStatus === "ai_flagged") {
    return (
      <div className="h-fit border border-red-200 bg-red-50 rounded-lg p-2.5 text-sm">
        <div className="font-semibold text-red-700">Detected Issues (AI)</div>
        <ul className="mt-2 list-disc pl-5 text-red-700/90 space-y-1">
          {project.aiIssues && project.aiIssues.length ? (
            project.aiIssues.map((issue, i) => <li key={i} className="wrap-break-word">{issue}</li>)
          ) : (
            <li>No issues listed (check extraction)</li>
          )}
        </ul>
      </div>
    );
  }

  if (project.reviewStatus === "reviewed") {
    return (
      <div className="h-fit border border-blue-200 bg-blue-50 rounded-lg p-2.5 text-sm">
        <div className="font-semibold text-blue-700">Official Review Comment</div>
        <p className="mt-2 text-blue-800 whitespace-pre-wrap wrap-break-word">
          {project.officialComment ?? "No comment recorded."}
        </p>
      </div>
    );
  }

  return (
    <div className="h-fit border border-slate-200 bg-white rounded-lg p-2.5 text-sm text-slate-600">
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
  onSubmit: (payload: ProjectReviewSubmitPayload) => Promise<void>;
  canComment?: boolean;
}) {
  const [comment, setComment] = React.useState("");
  const [form, setForm] = React.useState<ProjectEditFormState | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const descriptionRef = React.useRef<HTMLTextAreaElement | null>(null);
  const outputsRef = React.useRef<HTMLTextAreaElement | null>(null);

  React.useEffect(() => {
    // reset form on project change
    setComment("");
    setForm(project ? toEditForm(project) : null);
    setFormError(null);
    setSubmitting(false);
    setIsEditing(false);
  }, [project]);

  React.useEffect(() => {
    autoResizeTextarea(descriptionRef.current);
    autoResizeTextarea(outputsRef.current);
  }, [form?.aipDescription, form?.expectedOutputs, isEditing]);

  if (!project || !form) return null;

  function updateField<K extends keyof ProjectEditFormState>(
    key: K,
    value: ProjectEditFormState[K]
  ) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function handleToggleEdit() {
    if (!project || !canComment || submitting) return;
    if (isEditing) {
      setForm(toEditForm(project));
      setFormError(null);
    }
    setIsEditing((prev) => !prev);
  }

  async function handleSubmit() {
    if (!project || !form) return;

    const trimmed = comment.trim();
    if (!trimmed) return;

    const trimmedRefCode = form.projectRefCode.trim();
    const trimmedDescription = form.aipDescription.trim();
    if (!trimmedRefCode || !trimmedDescription) {
      setFormError("AIP Reference Code and Program/Project/Activity are required.");
      return;
    }

    const psBudget = parseBudget(form.psBudget);
    const mooeBudget = parseBudget(form.mooeBudget);
    const coBudget = parseBudget(form.coBudget);

    if (!psBudget.valid || !mooeBudget.valid || !coBudget.valid) {
      setFormError("PS, MOOE, and CO must be valid non-negative numbers.");
      return;
    }

    let totalAmount = project.amount;
    if (psBudget.value !== null && mooeBudget.value !== null && coBudget.value !== null) {
      totalAmount = psBudget.value + mooeBudget.value + coBudget.value;
    }

    const projectUpdates: SubmitReviewProjectUpdates = {
      projectRefCode: trimmedRefCode,
      aipDescription: trimmedDescription,
      implementingOffice: toNullableString(form.implementingOffice),
      startDate: toNullableString(form.startDate),
      completionDate: toNullableString(form.completionDate),
      expectedOutputs: toNullableString(form.expectedOutputs),
      fundingSource: toNullableString(form.fundingSource),
      psBudget: psBudget.value,
      mooeBudget: mooeBudget.value,
      coBudget: coBudget.value,
      amount: totalAmount,
      climateChangeAdaptation: toNullableString(form.climateChangeAdaptation),
      climateChangeMitigation: toNullableString(form.climateChangeMitigation),
      ccTypologyCode: toNullableString(form.ccTypologyCode),
      rmObjectiveCode: toNullableString(form.rmObjectiveCode),
      sector: form.sector,
    };

    try {
      setSubmitting(true);
      setFormError(null);
      await onSubmit({ comment: trimmed, projectUpdates });
      onOpenChange(false);
    } catch (error) {
      // Surface error to user (e.g., toast notification)
      console.error("Failed to submit review:", error);
      // Consider adding: toast.error("Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const parsedPs = parseBudget(form.psBudget);
  const parsedMooe = parseBudget(form.mooeBudget);
  const parsedCo = parseBudget(form.coBudget);

  const totalBudget = (() => {
    if (
      parsedPs.valid &&
      parsedMooe.valid &&
      parsedCo.valid &&
      parsedPs.value !== null &&
      parsedMooe.value !== null &&
      parsedCo.value !== null
    ) {
      return parsedPs.value + parsedMooe.value + parsedCo.value;
    }
    return project.amount;
  })();

  const formDisabled = !canComment || submitting;
  const projectFieldsLocked = formDisabled || !isEditing;
  const inputEditClass = "h-7 px-2 py-1 !text-xs placeholder:!text-xs";
  const inputViewClass =
    "h-7 py-0 !text-xs border-transparent bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0";
  const textareaEditClass = "min-h-7 px-2 py-1 !text-xs placeholder:!text-xs resize-none overflow-hidden";
  const textareaViewClass =
    "!text-xs border-transparent bg-transparent px-0 py-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 resize-none overflow-hidden";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[98vw] sm:max-w-250">
        <DialogHeader>
          <DialogTitle>
            {project.reviewStatus === "ai_flagged" ? "Error Review - Project Details" : "Project Details"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Left: project info */}
          <div className="md:col-span-2 border border-slate-200 rounded-lg p-2.5">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs font-semibold text-slate-900">Project Information</div>
              {canComment && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={handleToggleEdit}
                  disabled={submitting}
                >
                  {isEditing ? "Cancel Edit" : "Edit"}
                </Button>
              )}
            </div>

            <div className="mt-2 space-y-1 text-xs">
              <div className="grid grid-cols-[14rem_1fr] items-center gap-2">
                <div className="text-slate-500">AIP Reference Code</div>
                <Input
                  value={form.projectRefCode}
                  onChange={(e) => updateField("projectRefCode", e.target.value)}
                  disabled={formDisabled}
                  readOnly={projectFieldsLocked}
                  className={projectFieldsLocked ? inputViewClass : inputEditClass}
                />
              </div>

              <div className="grid grid-cols-[14rem_1fr] items-start gap-2">
                <div className="pt-2 text-slate-500">Program/Project/Activity</div>
                <Textarea
                  ref={descriptionRef}
                  value={form.aipDescription}
                  onChange={(e) => updateField("aipDescription", e.target.value)}
                  onInput={(e) => autoResizeTextarea(e.currentTarget)}
                  disabled={formDisabled}
                  readOnly={projectFieldsLocked}
                  rows={1}
                  className={
                    projectFieldsLocked
                      ? `${textareaViewClass} min-h-7`
                      : textareaEditClass
                  }
                />
              </div>

              <div className="grid grid-cols-[14rem_1fr] items-center gap-2">
                <div className="text-slate-500">Implementing Office/Department</div>
                <Input
                  value={form.implementingOffice}
                  onChange={(e) => updateField("implementingOffice", e.target.value)}
                  disabled={formDisabled}
                  readOnly={projectFieldsLocked}
                  className={projectFieldsLocked ? inputViewClass : inputEditClass}
                />
              </div>

              <div className="grid grid-cols-[14rem_1fr] items-center gap-2">
                <div className="text-slate-500">Starting Date</div>
                <Input
                  value={form.startDate}
                  onChange={(e) => updateField("startDate", e.target.value)}
                  disabled={formDisabled}
                  readOnly={projectFieldsLocked}
                  className={projectFieldsLocked ? inputViewClass : inputEditClass}
                />
              </div>

              <div className="grid grid-cols-[14rem_1fr] items-center gap-2">
                <div className="text-slate-500">Completion Date</div>
                <Input
                  value={form.completionDate}
                  onChange={(e) => updateField("completionDate", e.target.value)}
                  disabled={formDisabled}
                  readOnly={projectFieldsLocked}
                  className={projectFieldsLocked ? inputViewClass : inputEditClass}
                />
              </div>

              <div className="grid grid-cols-[14rem_1fr] items-start gap-2">
                <div className="pt-2 text-slate-500">Expected Outputs</div>
                <Textarea
                  ref={outputsRef}
                  value={form.expectedOutputs}
                  onChange={(e) => updateField("expectedOutputs", e.target.value)}
                  onInput={(e) => autoResizeTextarea(e.currentTarget)}
                  disabled={formDisabled}
                  readOnly={projectFieldsLocked}
                  rows={1}
                  className={
                    projectFieldsLocked
                      ? `${textareaViewClass} min-h-7`
                      : textareaEditClass
                  }
                />
              </div>

              <div className="grid grid-cols-[14rem_1fr] items-center gap-2">
                <div className="text-slate-500">Funding Source</div>
                <Input
                  value={form.fundingSource}
                  onChange={(e) => updateField("fundingSource", e.target.value)}
                  disabled={formDisabled}
                  readOnly={projectFieldsLocked}
                  className={projectFieldsLocked ? inputViewClass : inputEditClass}
                />
              </div>

              <div className="grid grid-cols-[14rem_1fr] items-center gap-2">
                <div className="text-slate-500">PS</div>
                <Input
                  value={form.psBudget}
                  onChange={(e) => updateField("psBudget", e.target.value)}
                  disabled={formDisabled}
                  readOnly={projectFieldsLocked}
                  className={projectFieldsLocked ? inputViewClass : inputEditClass}
                  inputMode="decimal"
                />
              </div>

              <div className="grid grid-cols-[14rem_1fr] items-center gap-2">
                <div className="text-slate-500">MOOE</div>
                <Input
                  value={form.mooeBudget}
                  onChange={(e) => updateField("mooeBudget", e.target.value)}
                  disabled={formDisabled}
                  readOnly={projectFieldsLocked}
                  className={projectFieldsLocked ? inputViewClass : inputEditClass}
                  inputMode="decimal"
                />
              </div>

              <div className="grid grid-cols-[14rem_1fr] items-center gap-2">
                <div className="text-slate-500">CO</div>
                <Input
                  value={form.coBudget}
                  onChange={(e) => updateField("coBudget", e.target.value)}
                  disabled={formDisabled}
                  readOnly={projectFieldsLocked}
                  className={projectFieldsLocked ? inputViewClass : inputEditClass}
                  inputMode="decimal"
                />
              </div>

              <div className="grid grid-cols-[14rem_1fr] items-center gap-2">
                <div className="text-slate-500">Total</div>
                <div className="h-7 rounded-md border border-slate-200 px-2 text-xs font-medium text-slate-800 flex items-center bg-slate-50">
                  {peso(totalBudget)}
                </div>
              </div>

              <div className="grid grid-cols-[14rem_1fr] items-center gap-2">
                <div className="text-slate-500">Climate Change Adaptation</div>
                <Input
                  value={form.climateChangeAdaptation}
                  onChange={(e) => updateField("climateChangeAdaptation", e.target.value)}
                  disabled={formDisabled}
                  readOnly={projectFieldsLocked}
                  className={projectFieldsLocked ? inputViewClass : inputEditClass}
                />
              </div>

              <div className="grid grid-cols-[14rem_1fr] items-center gap-2">
                <div className="text-slate-500">Climate Change Mitigation</div>
                <Input
                  value={form.climateChangeMitigation}
                  onChange={(e) => updateField("climateChangeMitigation", e.target.value)}
                  disabled={formDisabled}
                  readOnly={projectFieldsLocked}
                  className={projectFieldsLocked ? inputViewClass : inputEditClass}
                />
              </div>

              <div className="grid grid-cols-[14rem_1fr] items-center gap-2">
                <div className="text-slate-500">CC Typology Code</div>
                <Input
                  value={form.ccTypologyCode}
                  onChange={(e) => updateField("ccTypologyCode", e.target.value)}
                  disabled={formDisabled}
                  readOnly={projectFieldsLocked}
                  className={projectFieldsLocked ? inputViewClass : inputEditClass}
                />
              </div>

              <div className="grid grid-cols-[14rem_1fr] items-center gap-2">
                <div className="text-slate-500">PRM/NCR/LGU RM Objective-Results Indicator Code</div>
                <Input
                  value={form.rmObjectiveCode}
                  onChange={(e) => updateField("rmObjectiveCode", e.target.value)}
                  disabled={formDisabled}
                  readOnly={projectFieldsLocked}
                  className={projectFieldsLocked ? inputViewClass : inputEditClass}
                />
              </div>

              <div className="grid grid-cols-[14rem_1fr] items-center gap-2">
                <div className="text-slate-500">Sector</div>
                <Select
                  value={form.sector}
                  onValueChange={(value) => updateField("sector", value as SubmitReviewProjectUpdates["sector"])}
                  disabled={projectFieldsLocked}
                >
                  <SelectTrigger
                    className={
                      projectFieldsLocked
                        ? "h-7 text-xs! border-transparent bg-transparent px-0 shadow-none"
                        : "h-7 px-2 text-xs!"
                    }
                  >
                    <SelectValue placeholder="Select sector" />
                  </SelectTrigger>
                  <SelectContent>
                    {SECTOR_OPTIONS.map((sector) => (
                      <SelectItem key={sector} value={sector} className="text-xs!">
                        {sector}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Right: review panel + comment */}
          <div className="space-y-3 text-xs self-start h-fit">
            <Panel project={project} />

            <div className="h-fit border border-slate-200 rounded-lg p-2.5">
              <div className="text-xs font-semibold text-slate-900">Official Comment</div>
              {!canComment ? (
                <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                  Feedback and project edits are only available when the AIP status is Draft or For Revision.
                </div>
              ) : (
                <>
                  <p className="mt-1 text-xs text-slate-500">
                    Provide your comment to dispute, clarify, or confirm the AI-detected issues.
                  </p>

                  {formError && (
                    <div className="mt-2 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                      {formError}
                    </div>
                  )}

                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Enter your official comment here..."
                    className="mt-3 min-h-28"
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

