"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

import { CommentThreadPanel } from "./comment-thread-panel";
import { getCommentThreadHighlightClassName } from "./comment-thread-highlight";
import { CommentThreadListCard } from "./comment-thread-list-card";
import { getCommentRepo } from "../services/comment-repo";
import { getCommentTargetLookup } from "../services/comment-target-lookup";
import { resolveCommentSidebar } from "../services/resolve-comment-sidebar";
import type { CommentSidebarItem, CommentThread } from "../types";

type Target =
  | { kind: "aip"; aipId: string }
  | { kind: "project"; projectId: string };

export function CommentThreadsSplitView({
  scope,
  target,
  selectedThreadId,
}: {
  scope: "city" | "barangay";
  target: Target;
  selectedThreadId?: string | null;
}) {
  const repo = React.useMemo(() => getCommentRepo(), []);
  const targetKind = target.kind;
  const targetAipId = target.kind === "aip" ? target.aipId : null;
  const targetProjectId = target.kind === "project" ? target.projectId : null;
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
        const filtered = allThreads.filter((thread) => {
          if (targetKind === "aip") {
            return (
              thread.target.targetKind === "aip_item" &&
              thread.target.aipId === targetAipId
            );
          }

          return (
            thread.target.targetKind === "project" &&
            thread.target.projectId === targetProjectId
          );
        });

        const lookup = getCommentTargetLookup();
        const resolved = await resolveCommentSidebar({
          threads: filtered,
          scope,
          ...lookup,
        });

        if (!active) return;
        setThreads(filtered);
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
  }, [repo, scope, targetKind, targetAipId, targetProjectId]);

  const threadMap = React.useMemo(
    () => new Map(threads.map((thread) => [thread.id, thread])),
    [threads]
  );

  const effectiveSelectedThreadId = React.useMemo(() => {
    if (!selectedThreadId) return null;
    return threadMap.has(selectedThreadId) ? selectedThreadId : null;
  }, [selectedThreadId, threadMap]);

  const rowRefs = React.useRef(new Map<string, HTMLDivElement | null>());
  const setRowRef = React.useCallback(
    (threadId: string) => (node: HTMLDivElement | null) => {
      rowRefs.current.set(threadId, node);
    },
    []
  );

  React.useEffect(() => {
    if (!effectiveSelectedThreadId) return;
    const node = rowRefs.current.get(effectiveSelectedThreadId);
    if (!node) return;
    requestAnimationFrame(() => {
      node.scrollIntoView({ block: "center" });
    });
  }, [effectiveSelectedThreadId]);

  if (loading) {
    return <div className="text-sm text-slate-500">Loading feedback…</div>;
  }

  if (error) {
    return <div className="text-sm text-rose-600">{error}</div>;
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
        No feedback for this item yet.
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
      <div className="space-y-4">
        {items.map((item) => {
          const thread = threadMap.get(item.threadId);
          const highlightClass = getCommentThreadHighlightClassName({
            threadId: item.threadId,
            selectedThreadId: effectiveSelectedThreadId,
          });
          const authorName = thread?.preview.authorName ?? "Citizen";
          const authorScopeLabel = thread?.preview.authorScopeLabel ?? null;

          return (
            <div key={item.threadId} ref={setRowRef(item.threadId)}>
              <Link href={item.href} className="block">
                <CommentThreadListCard
                  authorName={authorName}
                  authorScopeLabel={authorScopeLabel}
                  updatedAt={item.updatedAt}
                  status={item.status}
                  contextTitle={item.contextTitle}
                  contextSubtitle={item.contextSubtitle}
                  snippet={item.snippet}
                  className={cn(highlightClass)}
                />
              </Link>
            </div>
          );
        })}
      </div>

      <div className="min-w-0">
        {effectiveSelectedThreadId ? (
          <CommentThreadPanel threadId={effectiveSelectedThreadId} />
        ) : null}
      </div>
    </div>
  );
}
