"use client";

import { useEffect, useMemo, useState } from "react";
import { getCommentRepo, getCommentTargetLookup } from "@/lib/repos/feedback/repo";
import { resolveCommentSidebar } from "@/lib/repos/feedback/queries";
import { CATEGORY_KINDS } from "@/lib/constants/feedback-kind";
import type { LguScopeKind } from "@/lib/auth/scope";
import type { CommentSidebarItem, CommentThread } from "../types";

type UseCommentsViewParams = {
  scope?: LguScopeKind;
  lguId?: string | null;
};

export function useCommentsView({
  scope = "barangay",
  lguId = null,
}: UseCommentsViewParams = {}) {
  const repo = useMemo(() => getCommentRepo(), []);
  const [threads, setThreads] = useState<CommentThread[]>([]);
  const [items, setItems] = useState<CommentSidebarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [year, setYear] = useState("all");
  const [status, setStatus] = useState<"all" | "no_response" | "responded">("all");
  const [context, setContext] = useState("all");
  const [category, setCategory] = useState<"all" | (typeof CATEGORY_KINDS)[number]>("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let isActive = true;

    async function loadThreads() {
      setLoading(true);
      setError(null);

      try {
        const threadList = await repo.listThreadsForInbox({
          scope,
          lguId,
          visibility: "authenticated",
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
    const set = new Set<number>();
    items.forEach((item) => {
      const yearValue = new Date(item.updatedAt).getFullYear();
      if (!Number.isNaN(yearValue)) set.add(yearValue);
    });
    return Array.from(set).sort((a, b) => b - a);
  }, [items]);

  const contextOptions = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => set.add(item.contextTitle));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (status !== "all" && item.status !== status) return false;
      if (context !== "all" && item.contextTitle !== context) return false;

      if (category !== "all") {
        const thread = threadMap.get(item.threadId);
        if (!thread || thread.preview.kind !== category) return false;
      }

      if (year !== "all") {
        const itemYear = new Date(item.updatedAt).getFullYear();
        if (Number.isNaN(itemYear) || itemYear !== Number(year)) return false;
      }

      if (!query.trim()) return true;

      const thread = threadMap.get(item.threadId);
      const haystack = [
        item.snippet,
        item.contextTitle,
        item.contextSubtitle,
        thread?.preview.authorName,
        thread?.preview.authorScopeLabel,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query.trim().toLowerCase());
    });
  }, [items, status, context, category, year, query, threadMap]);

  return {
    categoryKinds: CATEGORY_KINDS,
    loading,
    error,
    year,
    setYear,
    status,
    setStatus,
    context,
    setContext,
    category,
    setCategory,
    query,
    setQuery,
    yearOptions,
    contextOptions,
    filteredItems,
    threadMap,
  };
}
