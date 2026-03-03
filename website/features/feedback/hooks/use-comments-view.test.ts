import { describe, expect, it } from "vitest";

import {
  applyCommentsViewFilters,
  getFeedbackKpiCounts,
} from "./use-comments-view";
import type { CommentSidebarItem, CommentThread } from "../types";

function buildThread(
  id: string,
  kind: CommentThread["preview"]["kind"],
  updatedAt: string,
  status: CommentThread["preview"]["status"],
  authorName: string
): CommentThread {
  return {
    id,
    createdAt: updatedAt,
    createdByUserId: `${id}-author`,
    target: {
      targetKind: "project",
      projectId: `${id}-project`,
    },
    preview: {
      text: `${authorName} message`,
      updatedAt,
      status,
      kind,
      authorName,
      authorRoleLabel: "Citizen",
      authorLguLabel: "Brgy. Sample",
      authorScopeLabel: "Brgy. Sample",
    },
  };
}

function buildItem(
  threadId: string,
  updatedAt: string,
  status: CommentSidebarItem["status"],
  contextTitle: string,
  snippet: string
): CommentSidebarItem {
  return {
    threadId,
    snippet,
    updatedAt,
    status,
    contextTitle,
    contextSubtitle: `${contextTitle} subtitle`,
    href: `/feedback/${threadId}`,
  };
}

describe("useCommentsView helpers", () => {
  const threads = [
    buildThread("t1", "question", "2026-02-01T00:00:00.000Z", "no_response", "Ana"),
    buildThread("t2", "commend", "2026-02-15T00:00:00.000Z", "responded", "Ben"),
    buildThread("t3", "suggestion", "2025-12-20T00:00:00.000Z", "responded", "Cara"),
    buildThread("t4", "concern", "2026-02-18T00:00:00.000Z", "no_response", "Dina"),
  ];
  const threadMap = new Map(threads.map((thread) => [thread.id, thread]));
  const items = [
    buildItem("t1", "2026-02-01T00:00:00.000Z", "no_response", "Project Alpha", "Water access"),
    buildItem("t2", "2026-02-15T00:00:00.000Z", "responded", "Project Alpha", "Great work"),
    buildItem("t3", "2025-12-20T00:00:00.000Z", "responded", "Project Beta", "Please add benches"),
    buildItem("t4", "2026-02-18T00:00:00.000Z", "no_response", "Project Beta", "Noise issue"),
  ];

  it("applies the kind filter for the list but ignores it for KPI filtering", () => {
    const filtered = applyCommentsViewFilters({
      items,
      threadMap,
      year: "all",
      status: "all",
      kind: "question",
      context: "all",
      query: "",
    });
    const kpiFiltered = applyCommentsViewFilters({
      items,
      threadMap,
      year: "all",
      status: "all",
      kind: "question",
      context: "all",
      query: "",
      ignoreKind: true,
    });

    expect(filtered.map((item) => item.threadId)).toEqual(["t1"]);
    expect(kpiFiltered.map((item) => item.threadId)).toEqual(["t1", "t2", "t3", "t4"]);
  });

  it("builds KPI counts from filtered root thread items", () => {
    const filtered = applyCommentsViewFilters({
      items,
      threadMap,
      year: "2026",
      status: "no_response",
      kind: "all",
      context: "Project Beta",
      query: "noise",
      ignoreKind: true,
    });

    expect(filtered.map((item) => item.threadId)).toEqual(["t4"]);
    expect(getFeedbackKpiCounts(filtered, threadMap)).toEqual({
      total: 1,
      commend: 0,
      suggestion: 0,
      question: 0,
      concern: 1,
    });
  });
});
