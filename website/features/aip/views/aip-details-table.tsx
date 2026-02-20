// feature/aips/views/aip-details-table.view.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { AipProjectEditPatch, AipProjectRow, AipStatus } from "../types";
import { AipDetailsTableCard } from "../components/aip-details-table-card";
import { BudgetAllocationTable, buildBudgetAllocation } from "../components/budget-allocation-table";
import { ProjectReviewModal } from "../dialogs/project-review-modal";
import {
  listAipProjectsAction,
  submitAipProjectReviewAction,
} from "../actions/aip-projects.actions";

type ProjectsStateSnapshot = {
  rows: AipProjectRow[];
  loading: boolean;
  error: string | null;
  unresolvedAiCount: number;
};

export function AipDetailsTableView({
  aipId,
  year,
  aipStatus,
  scope,
  focusedRowId,
  enablePagination = false,
  onProjectRowClick,
  onProjectsStateChange,
}: {
  aipId: string;
  year: number;
  aipStatus: AipStatus;
  scope: "city" | "barangay";
  focusedRowId?: string;
  enablePagination?: boolean;
  onProjectRowClick?: (row: AipProjectRow) => void;
  onProjectsStateChange?: (state: ProjectsStateSnapshot) => void;
}) {
  const router = useRouter();
  const [rows, setRows] = React.useState<AipProjectRow[]>([]);
  const [selected, setSelected] = React.useState<AipProjectRow | null>(null);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await listAipProjectsAction(aipId);
        if (alive) {
          setRows(data);
        }
      } catch (err) {
        if (alive) {
          setError(err instanceof Error ? err.message : "Failed to load projects.");
          setRows([]);
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, [aipId]);

  async function handleSubmitReview(
    payload: {
      reason: string;
      changes?: AipProjectEditPatch;
      resolution: "disputed" | "confirmed" | "comment_only";
    }
  ) {
    if (!selected) return;

    const updated = await submitAipProjectReviewAction({
      projectId: selected.id,
      aipId: selected.aipId,
      reason: payload.reason,
      changes: payload.changes,
      resolution: payload.resolution,
    });

    setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    setSelected(updated);
  }

  const unresolvedAiCount = React.useMemo(
    () => rows.filter((row) => row.reviewStatus === "ai_flagged").length,
    [rows]
  );

  React.useEffect(() => {
    onProjectsStateChange?.({
      rows,
      loading,
      error,
      unresolvedAiCount,
    });
  }, [error, loading, onProjectsStateChange, rows, unresolvedAiCount]);

  const allocation = React.useMemo(() => buildBudgetAllocation(rows), [rows]);

  if (loading) {
    return <div className="text-sm text-slate-500">Loading projects...</div>;
  }
  if (error) {
    return <div className="text-sm text-rose-600">{error}</div>;
  }

  // Allow commenting when AIP is in draft or for_revision status
  const canComment = aipStatus === "draft" || aipStatus === "for_revision";

  return (
    <>
      <BudgetAllocationTable
        rows={allocation.rows}
        totalBudget={allocation.totalBudget}
        totalProjects={allocation.totalProjects}
      />

      <AipDetailsTableCard
        year={year}
        rows={rows}
        onRowClick={(row) => {
          if (onProjectRowClick) {
            onProjectRowClick(row);
            return;
          }
          if (scope === "barangay") {
            router.push(
              `/barangay/aips/${encodeURIComponent(aipId)}/${encodeURIComponent(row.id)}`
            );
            return;
          }
          setSelected(row);
          setOpen(true);
        }}
        canComment={canComment}
        showCommentingNote={scope === "barangay"}
        focusedRowId={focusedRowId}
        enablePagination={enablePagination}
      />

      {scope === "city" ? (
        <ProjectReviewModal
          open={open}
          onOpenChange={setOpen}
          project={selected}
          onSubmit={handleSubmitReview}
          canComment={canComment}
        />
      ) : null}
    </>
  );
}
