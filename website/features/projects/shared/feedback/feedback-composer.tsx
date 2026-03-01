"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  CITIZEN_PROJECT_FEEDBACK_KINDS,
  PROJECT_FEEDBACK_MAX_LENGTH,
  type CitizenProjectFeedbackKind,
} from "./feedback.types";

type FeedbackComposerSubmitPayload = {
  kind: CitizenProjectFeedbackKind;
  body: string;
};

type FeedbackComposerProps = {
  submitLabel: string;
  disabled?: boolean;
  placeholder?: string;
  initialKind?: CitizenProjectFeedbackKind;
  onSubmit: (payload: FeedbackComposerSubmitPayload) => Promise<void> | void;
  onCancel?: () => void;
};

const KIND_OPTIONS: Array<{
  value: CitizenProjectFeedbackKind;
  label: string;
}> = [
  { value: "commend", label: "Commend" },
  { value: "suggestion", label: "Suggestion" },
  { value: "concern", label: "Concern" },
  { value: "question", label: "Question" },
];

export function FeedbackComposer({
  submitLabel,
  disabled = false,
  placeholder = "Write your feedback...",
  initialKind = "question",
  onSubmit,
  onCancel,
}: FeedbackComposerProps) {
  const [kind, setKind] = React.useState<CitizenProjectFeedbackKind | "">(initialKind);
  const [body, setBody] = React.useState("");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const bodyLength = body.length;
  const bodyRemaining = PROJECT_FEEDBACK_MAX_LENGTH - bodyLength;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    if (!kind || !CITIZEN_PROJECT_FEEDBACK_KINDS.includes(kind)) {
      setErrorMessage("Please select a feedback kind.");
      return;
    }

    const normalized = body.trim();
    if (!normalized) {
      setErrorMessage("Feedback content is required.");
      return;
    }

    if (normalized.length > PROJECT_FEEDBACK_MAX_LENGTH) {
      setErrorMessage(`Feedback must be ${PROJECT_FEEDBACK_MAX_LENGTH} characters or less.`);
      return;
    }

    try {
      await onSubmit({
        kind,
        body: normalized,
      });
      setBody("");
      setKind(initialKind);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to submit feedback.";
      setErrorMessage(message);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-xl border border-slate-200 bg-white p-4"
    >
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">Feedback kind</label>
        <Select
          value={kind}
          onValueChange={(value) => setKind(value as CitizenProjectFeedbackKind)}
          disabled={disabled}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select feedback kind" />
          </SelectTrigger>
          <SelectContent>
            {KIND_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">Message</label>
        <Textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder={placeholder}
          maxLength={PROJECT_FEEDBACK_MAX_LENGTH + 1}
          disabled={disabled}
          aria-label="Feedback message"
          className="min-h-[112px]"
        />
        <p className={`text-xs ${bodyRemaining < 0 ? "text-rose-600" : "text-slate-500"}`}>
          {Math.max(bodyRemaining, 0)} characters remaining
        </p>
      </div>

      {errorMessage ? <p className="text-sm text-rose-600">{errorMessage}</p> : null}

      <div className="flex flex-wrap justify-end gap-2">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel} disabled={disabled}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" disabled={disabled}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
