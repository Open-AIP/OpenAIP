"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/ui/utils";

import { CommentThreadListCard } from "./comment-thread-list-card";
import { getCommentThreadHighlightClassName } from "./comment-thread-highlight";
import { getCommentRepo, getCommentTargetLookup } from "@/lib/repos/feedback/repo";
import { resolveCommentSidebar } from "@/lib/repos/feedback/queries";
import type { CommentSidebarItem, CommentThread } from "../types";

export function CommentAipThreadList({
  aipId,
  scope,
  activeThreadId,
}: {
  aipId: string;
  scope: "city" | "barangay";
  activeThreadId?: string | null;
}) {
  const repo = React.useMemo(() => getCommentRepo(), []);
  const [items, setItems] = React.useState<CommentSidebarItem[]>([]);
  const [threads, setThreads] = React.useState<CommentThread[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const allThreads = await repo.listThreadsForInbox({
          lguId: "lgu_barangay_001",
        });
        const aipThreads = allThreads.filter(
          (thread) =>
            thread.target.targetKind === "aip_item" && thread.target.aipId === aipId
        );

        const lookup = getCommentTargetLookup();
        const resolved = await resolveCommentSidebar({
          threads: aipThreads,
          scope,
          ...lookup,
        });

        if (!active) return;
        setThreads(aipThreads);
        setItems(resolved);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load feedback.");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [repo, aipId, scope]);

  const threadMap = React.useMemo(
    () => new Map(threads.map((thread) => [thread.id, thread])),
    [threads]
  );

  if (loading) {
    return <div className="text-sm text-slate-500">Loading feedback…</div>;
  }

  if (error) {
    return <div className="text-sm text-rose-600">{error}</div>;
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
        No feedback for this AIP yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const thread = threadMap.get(item.threadId);
        const highlightClass = getCommentThreadHighlightClassName({
          threadId: item.threadId,
          selectedThreadId: activeThreadId,
        });

        return (
          <Link key={item.threadId} href={item.href} className="block">
            <CommentThreadListCard
              authorName={thread?.preview.authorName ?? "Citizen"}
              authorScopeLabel={thread?.preview.authorScopeLabel ?? null}
              updatedAt={item.updatedAt}
              contextTitle={item.contextTitle}
              contextSubtitle={item.contextSubtitle}
              snippet={item.snippet}
              status={item.status}
              className={cn(highlightClass)}
            />
          </Link>
        );
      })}
    </div>
  );
}
