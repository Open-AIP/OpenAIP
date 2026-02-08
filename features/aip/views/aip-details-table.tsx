// feature/aips/views/aip-details-table.view.tsx
"use client";

import * as React from "react";
import type { AipProjectRepo } from "@/lib/repos/aip/repo";
import type { AipProjectRow, AipStatus } from "../types";
import { AipDetailsTableCard } from "../components/aip-details-table-card";
import { BudgetAllocationTable, buildBudgetAllocation } from "../components/budget-allocation-table";
import { ProjectReviewModal } from "../dialogs/project-review-modal";


export function AipDetailsTableView({
  aipId,
  year,
  repo,
  aipStatus,
  focusedRowId,
}: {
  aipId: string;
  year: number;
  repo: AipProjectRepo;
  aipStatus: AipStatus;
  focusedRowId?: string;
}) {
  const [rows, setRows] = React.useState<AipProjectRow[]>([]);
  const [selected, setSelected] = React.useState<AipProjectRow | null>(null);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      const data = await repo.listByAip(aipId);

      if (alive) {
        setRows(data);
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [aipId, repo]);

  async function handleSubmitReview(
    payload: { comment: string; resolution: "disputed" | "confirmed" | "comment_only" }
  ) {
    if (!selected) return;

    await repo.submitReview({
      projectId: selected.id,
      aipId: selected.aipId,
      comment: payload.comment,
      resolution: payload.resolution,
    });

    // Optimistic UI update
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== selected.id) return r;

        if (r.reviewStatus === "ai_flagged") {
          return {
            ...r,
            reviewStatus: "reviewed",
            officialComment: payload.comment,
          };
        }

        return { ...r, officialComment: payload.comment };
      })
    );
  }

  const allocation = React.useMemo(() => buildBudgetAllocation(rows), [rows]);

  if (loading) {
    return <div className="text-sm text-slate-500">Loading projects…</div>;
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
          setSelected(row);
          setOpen(true);
        }}
        canComment={canComment}
        focusedRowId={focusedRowId}
      />

      <ProjectReviewModal
        open={open}
        onOpenChange={setOpen}
        project={selected}
        onSubmit={handleSubmitReview}
        canComment={canComment}
      />
    </>
  );
}
