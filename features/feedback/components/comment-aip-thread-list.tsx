"use client";

import * as React from "react";
import Link from "next/link";
import { CommentCard } from "./comment-card";
import { getCommentRepo } from "../services/comment-repo";
import { createMockCommentTargetLookup } from "../services/comment-target-lookup.mock";
import { resolveCommentSidebar } from "../services/resolve-comment-sidebar";
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
            thread.target.targetKind === "aip_item" &&
            thread.target.aipId === aipId
        );

        const lookup = createMockCommentTargetLookup();
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
        setError(
          err instanceof Error ? err.message : "Failed to load feedback."
        );
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
        const projectLabel = `${item.contextTitle} • ${item.contextSubtitle}`;
        const isActive = activeThreadId === item.threadId;

        return (
          <Link key={item.threadId} href={item.href} className="block">
            <CommentCard
              commenterName={thread?.preview.authorName ?? "Citizen"}
              barangayName={thread?.preview.authorScopeLabel ?? null}
              createdAt={item.updatedAt}
              projectLabel={projectLabel}
              comment={item.snippet}
              status={item.status}
              showActions={false}
              className={isActive ? "ring-2 ring-amber-400 ring-inset" : ""}
            />
          </Link>
        );
      })}
    </div>
  );
}
