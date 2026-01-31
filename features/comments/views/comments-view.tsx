"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CommentCard } from "../components/comment-card";
import {
  createMockCommentTargetLookup,
  getCommentRepo,
  resolveCommentSidebar,
} from "../services";
import type { CommentSidebarItem, CommentThread } from "../types";

export default function CommentsView() {
  const repo = useMemo(() => getCommentRepo(), []);
  const [threads, setThreads] = useState<CommentThread[]>([]);
  const [items, setItems] = useState<CommentSidebarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadThreads() {
      setLoading(true);
      setError(null);

      try {
        const threadList = await repo.listThreadsForInbox({
          lguId: "lgu_barangay_001",
        });
        const lookup = createMockCommentTargetLookup();
        const resolved = await resolveCommentSidebar({
          threads: threadList,
          scope: "barangay",
          ...lookup,
        });

        if (!isActive) return;
        setThreads(threadList);
        setItems(resolved);
      } catch (err) {
        if (!isActive) return;
        setError(
          err instanceof Error ? err.message : "Failed to load comments."
        );
      } finally {
        if (isActive) setLoading(false);
      }
    }

    loadThreads();

    return () => {
      isActive = false;
    };
  }, [repo]);

  const threadMap = useMemo(
    () => new Map(threads.map((thread) => [thread.id, thread])),
    [threads]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Comments</h1>
        <p className="mt-2 text-sm text-slate-600">
          Review citizen feedback and respond to comments related to published
          AIPs and projects.
        </p>
      </div>

      {loading ? (
        <div className="text-sm text-slate-500">Loading inbox…</div>
      ) : error ? (
        <div className="text-sm text-rose-600">{error}</div>
      ) : (
        <>
          <div className="text-sm text-slate-500">
            Showing {items.length} threads
          </div>

          <div className="space-y-5">
            {items.map((item) => {
              const thread = threadMap.get(item.threadId);
              const projectLabel = `${item.contextTitle} • ${item.contextSubtitle}`;

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
                  />
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
