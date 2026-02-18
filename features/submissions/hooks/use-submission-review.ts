"use client";

import { useMemo, useState } from "react";
import { publishAipAction, requestRevisionAction } from "../actions/submissionsReview.actions";

type UseSubmissionReviewInput = {
  aipId: string;
  isReviewMode: boolean;
  initialResult?: string;
  status: string;
  onPublished: () => void;
  onRequestedRevision: () => void;
};

export function useSubmissionReview(input: UseSubmissionReviewInput) {
  const [publishedSuccess, setPublishedSuccess] = useState(false);
  const [note, setNote] = useState("");
  const [noteError, setNoteError] = useState<string | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [revisionOpen, setRevisionOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const showSuccess = useMemo(
    () => (input.isReviewMode && input.initialResult === "published") || publishedSuccess,
    [input.initialResult, input.isReviewMode, publishedSuccess]
  );
  const canReview = input.isReviewMode && input.status === "under_review";

  async function confirmPublish() {
    setSubmitError(null);
    try {
      setSubmitting(true);
      const trimmed = note.trim();
      const response = await publishAipAction({
        aipId: input.aipId,
        note: trimmed ? trimmed : undefined,
      });

      if (!response.ok) {
        setSubmitError(response.message ?? "Failed to publish AIP.");
        return;
      }

      setPublishOpen(false);
      setNote("");
      setPublishedSuccess(true);
      input.onPublished();
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmRequestRevision() {
    setSubmitError(null);
    const trimmed = note.trim();
    if (!trimmed) {
      setNoteError("Revision comments are required.");
      return;
    }

    try {
      setSubmitting(true);
      const response = await requestRevisionAction({ aipId: input.aipId, note: trimmed });

      if (!response.ok) {
        setSubmitError(response.message ?? "Failed to request revision.");
        return;
      }

      setRevisionOpen(false);
      setNote("");
      input.onRequestedRevision();
    } finally {
      setSubmitting(false);
    }
  }

  function openRevisionDialog() {
    if (!note.trim()) {
      setNoteError("Revision comments are required.");
      return;
    }
    setRevisionOpen(true);
  }

  return {
    note,
    setNote,
    noteError,
    setNoteError,
    publishOpen,
    setPublishOpen,
    revisionOpen,
    setRevisionOpen,
    submitError,
    submitting,
    showSuccess,
    canReview,
    confirmPublish,
    confirmRequestRevision,
    openRevisionDialog,
  };
}
