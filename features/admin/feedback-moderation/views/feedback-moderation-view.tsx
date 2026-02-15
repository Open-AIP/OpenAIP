"use client";

import { useEffect, useMemo, useState } from "react";
import FeedbackModerationTabs, {
  FeedbackModerationTab,
} from "../components/FeedbackModerationTabs";
import FeedbackFiltersRow from "../components/FeedbackFiltersRow";
import PublicFeedbackTable from "../components/PublicFeedbackTable";
import FeedbackDetailsModal from "../components/FeedbackDetailsModal";
import HideFeedbackModal from "../components/HideFeedbackModal";
import UnhideFeedbackModal from "../components/UnhideFeedbackModal";
import ProjectUpdatesPage from "@/features/admin/feedback-moderation-project-updates/components/ProjectUpdatesPage";
import {
  mapFeedbackModerationRows,
  type FeedbackModerationRow,
} from "@/lib/repos/feedback-moderation/mappers/feedback.mapper";
import type { FeedbackModerationDataset } from "@/lib/repos/feedback-moderation/types";
import { getFeedbackModerationRepo } from "@/lib/repos/feedback-moderation/repo";
import { CATEGORY_KINDS, formatFeedbackKind } from "@/features/feedback/lib/kind";

const VIOLATION_OPTIONS = [
  "Spam",
  "Harassment",
  "Offensive Language",
  "Misinformation",
  "Policy Violation",
  "Rate Limit Breach",
];

const CATEGORY_OPTIONS = [
  { value: "all", label: "All Category" },
  ...CATEGORY_KINDS.map((kind) => ({ value: kind, label: formatFeedbackKind(kind) })),
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "visible", label: "Visible" },
  { value: "hidden", label: "Hidden" },
];

const ADMIN_ACTOR = {
  id: "admin_001",
  role: "admin" as const,
};

export default function FeedbackModerationView() {
  const repo = useMemo(() => getFeedbackModerationRepo(), []);
  const [activeTab, setActiveTab] = useState<FeedbackModerationTab>("feedback");
  const [dataset, setDataset] = useState<FeedbackModerationDataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [lguFilter, setLguFilter] = useState("all");

  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [hideId, setHideId] = useState<string | null>(null);
  const [unhideId, setUnhideId] = useState<string | null>(null);
  const [hideReason, setHideReason] = useState("");
  const [hideViolation, setHideViolation] = useState("");
  const [unhideReason, setUnhideReason] = useState("");

  useEffect(() => {
    let isActive = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const result = await repo.listDataset();
        if (!isActive) return;
        setDataset(result);
      } catch (err) {
        if (!isActive) return;
        setError(err instanceof Error ? err.message : "Failed to load feedback dataset.");
      } finally {
        if (isActive) setLoading(false);
      }
    }

    load();

    return () => {
      isActive = false;
    };
  }, [repo]);

  const rows = useMemo<FeedbackModerationRow[]>(
    () => (dataset ? mapFeedbackModerationRows(dataset) : []),
    [dataset]
  );

  const lguOptions = useMemo(
    () => Array.from(new Set(rows.map((row) => row.lguName))).sort((a, b) => a.localeCompare(b)),
    [rows]
  );

  const filteredRows = useMemo(() => {
    const loweredQuery = query.trim().toLowerCase();

    return rows.filter((row) => {
      if (categoryFilter !== "all" && row.kind !== categoryFilter) return false;

      if (statusFilter !== "all") {
        const statusValue = row.status === "Visible" ? "visible" : "hidden";
        if (statusValue !== statusFilter) return false;
      }

      if (lguFilter !== "all" && row.lguName !== lguFilter) return false;

      if (!loweredQuery) return true;

      const haystack = [
        row.commentPreview,
        row.submittedByName,
        row.submittedByEmail,
        row.lguName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(loweredQuery);
    });
  }, [rows, categoryFilter, statusFilter, lguFilter, query]);

  const detailsRow = rows.find((row) => row.id === detailsId) ?? null;

  const resetHideState = () => {
    setHideId(null);
    setHideReason("");
    setHideViolation("");
  };

  const resetUnhideState = () => {
    setUnhideId(null);
    setUnhideReason("");
  };

  const handleHideConfirm = async () => {
    if (!hideId) return;

    const next = await repo.hideFeedback({
      feedbackId: hideId,
      reason: hideReason.trim(),
      violationCategory: hideViolation || null,
      actorId: ADMIN_ACTOR.id,
      actorRole: ADMIN_ACTOR.role,
    });

    setDataset(next);
    resetHideState();
  };

  const handleUnhideConfirm = async () => {
    if (!unhideId) return;

    const next = await repo.unhideFeedback({
      feedbackId: unhideId,
      reason: unhideReason.trim(),
      violationCategory: null,
      actorId: ADMIN_ACTOR.id,
      actorRole: ADMIN_ACTOR.role,
    });

    setDataset(next);
    resetUnhideState();
  };

  return (
    <div className="space-y-6 text-[13.5px] text-slate-700">
      <div className="space-y-2">
        <h1 className="text-[28px] font-semibold text-slate-900">Feedback Moderation</h1>
        <p className="text-[14px] text-muted-foreground">
          Moderate public feedback and enforce compliance on project updates and uploaded media while preserving accountability records.
        </p>
      </div>

      <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-[13.5px] text-slate-700">
        <span className="font-semibold text-slate-900">Accountability Policy:</span>{" "}
        All moderation actions are audit-logged. Content is never permanently deleted; hidden items are preserved for accountability and can be restored.
      </div>

      <FeedbackModerationTabs value={activeTab} onChange={setActiveTab} />

      {activeTab === "feedback" ? (
        <div className="space-y-6">
          <div className="space-y-1">
            <div className="text-base font-semibold text-slate-900">Public Feedback</div>
            <div className="text-sm text-slate-500">
              Feedback are moderated but never permanently deleted.
            </div>
          </div>

          <FeedbackFiltersRow
            query={query}
            onQueryChange={setQuery}
            categoryFilter={categoryFilter}
            onCategoryChange={setCategoryFilter}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            lguFilter={lguFilter}
            onLguChange={setLguFilter}
            categoryOptions={CATEGORY_OPTIONS}
            statusOptions={STATUS_OPTIONS}
            lguOptions={lguOptions}
          />

          {loading ? (
            <div className="text-sm text-slate-500">Loading feedback...</div>
          ) : error ? (
            <div className="text-sm text-rose-600">{error}</div>
          ) : (
            <PublicFeedbackTable
              rows={filteredRows}
              onViewDetails={(id) => setDetailsId(id)}
              onHide={(id) => {
                setHideId(id);
                setHideReason("");
                setHideViolation("");
              }}
              onUnhide={(id) => {
                setUnhideId(id);
                setUnhideReason("");
              }}
            />
          )}
        </div>
      ) : (
        <ProjectUpdatesPage />
      )}

      <FeedbackDetailsModal
        open={detailsId !== null}
        onOpenChange={(open) => {
          if (!open) setDetailsId(null);
        }}
        row={detailsRow}
      />

      <HideFeedbackModal
        open={hideId !== null}
        onOpenChange={(open) => {
          if (!open) resetHideState();
        }}
        reason={hideReason}
        onReasonChange={setHideReason}
        violationCategory={hideViolation}
        onViolationCategoryChange={setHideViolation}
        onConfirm={handleHideConfirm}
        violationOptions={VIOLATION_OPTIONS}
      />

      <UnhideFeedbackModal
        open={unhideId !== null}
        onOpenChange={(open) => {
          if (!open) resetUnhideState();
        }}
        reason={unhideReason}
        onReasonChange={setUnhideReason}
        onConfirm={handleUnhideConfirm}
      />
    </div>
  );
}
