"use client";

import { useEffect, useMemo, useState } from "react";
import { getCommentRepo, getCommentTargetLookup } from "@/lib/repos/feedback/repo";
import { resolveCommentSidebar } from "@/lib/repos/feedback/queries";
import type { CategoryKind } from "@/lib/constants/feedback-kind";
import type { CommentSidebarItem, CommentThread } from "../types";

type StatusFilter = "all" | "no_response" | "responded";
type YearFilter = string;
type ContextFilter = string;
type QueryFilter = string;

export type FeedbackKpiCounts = {
  total: number;
  commend: number;
  suggestion: number;
  question: number;
  concern: number;
};

type ApplyCommentsViewFiltersParams = {
  items: CommentSidebarItem[];
  threadMap: Map<string, CommentThread>;
  year: YearFilter;
  status: StatusFilter;
  kind: CategoryKind | "all";
  context: ContextFilter;
  query: QueryFilter;
  ignoreKind?: boolean;
};

export function applyCommentsViewFilters({
  items,
  threadMap,
  year,
  status,
  kind,
  context,
  query,
  ignoreKind = false,
}: ApplyCommentsViewFiltersParams): CommentSidebarItem[] {
  const normalizedQuery = query.trim().toLowerCase();

  return items.filter((item) => {
    if (status !== "all" && item.status !== status) return false;

    const thread = threadMap.get(item.threadId);
    if (!ignoreKind && kind !== "all" && thread?.preview.kind !== kind) return false;

    if (context !== "all" && item.contextTitle !== context) return false;

    if (year !== "all") {
      const itemYear = new Date(item.updatedAt).getFullYear();
      if (Number.isNaN(itemYear) || itemYear !== Number(year)) return false;
    }

    if (!normalizedQuery) return true;

    const haystack = [
      item.snippet,
      item.contextTitle,
      item.contextSubtitle,
      thread?.preview.authorName,
      thread?.preview.authorRoleLabel,
      thread?.preview.authorLguLabel,
      thread?.preview.authorScopeLabel,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

export function getFeedbackKpiCounts(
  items: CommentSidebarItem[],
  threadMap: Map<string, CommentThread>
): FeedbackKpiCounts {
  return items.reduce<FeedbackKpiCounts>(
    (counts, item) => {
      counts.total += 1;

      const kind = threadMap.get(item.threadId)?.preview.kind;
      if (kind === "commend") counts.commend += 1;
      if (kind === "suggestion") counts.suggestion += 1;
      if (kind === "question") counts.question += 1;
      if (kind === "concern") counts.concern += 1;

      return counts;
    },
    {
      total: 0,
      commend: 0,
      suggestion: 0,
      question: 0,
      concern: 0,
    }
  );
}

export function useCommentsView({
  scope = "barangay",
  lguId = "lgu_barangay_001",
}: {
  scope?: "city" | "barangay";
  lguId?: string;
}) {
  const repo = useMemo(() => getCommentRepo(), []);
  const [threads, setThreads] = useState<CommentThread[]>([]);
  const [items, setItems] = useState<CommentSidebarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [year, setYear] = useState("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [kind, setKind] = useState<CategoryKind | "all">("all");
  const [context, setContext] = useState("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let isActive = true;

    async function loadThreads() {
      setLoading(true);
      setError(null);

      try {
        const threadList = await repo.listThreadsForInbox({
          lguId,
          scope,
        });
        const lookup = getCommentTargetLookup();
        const resolved = await resolveCommentSidebar({
          threads: threadList,
          scope,
          ...lookup,
        });

        if (!isActive) return;
        setThreads(threadList);
        setItems(resolved);
      } catch (err) {
        if (!isActive) return;
        setError(err instanceof Error ? err.message : "Failed to load feedback.");
      } finally {
        if (isActive) setLoading(false);
      }
    }

    loadThreads();

    return () => {
      isActive = false;
    };
  }, [repo, lguId, scope]);

  const threadMap = useMemo(
    () => new Map(threads.map((thread) => [thread.id, thread])),
    [threads]
  );

  const yearOptions = useMemo(() => {
    const values = new Set<number>();
    items.forEach((item) => {
      const yearValue = new Date(item.updatedAt).getFullYear();
      if (!Number.isNaN(yearValue)) values.add(yearValue);
    });
    return Array.from(values).sort((a, b) => b - a);
  }, [items]);

  const contextOptions = useMemo(() => {
    const values = new Set<string>();
    items.forEach((item) => values.add(item.contextTitle));
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const filteredItems = useMemo(
    () =>
      applyCommentsViewFilters({
        items,
        threadMap,
        year,
        status,
        kind,
        context,
        query,
      }),
    [context, items, kind, query, status, threadMap, year]
  );

  const kpiCounts = useMemo(() => {
    const kpiItems = applyCommentsViewFilters({
      items,
      threadMap,
      year,
      status,
      kind,
      context,
      query,
      ignoreKind: true,
    });

    return getFeedbackKpiCounts(kpiItems, threadMap);
  }, [context, items, kind, query, status, threadMap, year]);

  return {
    loading,
    error,
    threads,
    threadMap,
    year,
    status,
    kind,
    context,
    query,
    yearOptions,
    contextOptions,
    filteredItems,
    kpiCounts,
    setYear,
    setStatus,
    setKind,
    setContext,
    setQuery,
  };
}
