"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { CommentThreadAccordionList } from "./comment-thread-accordion-list";
import { getCommentRepo, getCommentTargetLookup } from "@/lib/repos/feedback/repo";
import { resolveCommentSidebar } from "@/lib/repos/feedback/queries";
import type { CommentSidebarItem, CommentThread } from "../types";

type Target =
  | { kind: "aip"; aipId: string }
  | { kind: "project"; projectId: string };

export function CommentThreadsSplitView({
  scope,
  target,
  selectedThreadId,
}: {
  scope: "city" | "barangay" | "citizen";
  target: Target;
  selectedThreadId?: string | null;
}) {
  const repo = React.useMemo(() => getCommentRepo(), []);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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
        setError(err instanceof Error ? err.message : "Failed to load feedback.");
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

  const accordionItems = React.useMemo(() => {
    return items.map((item) => {
      const thread = threadMap.get(item.threadId);
      return {
        threadId: item.threadId,
        href: item.href,
        card: {
          authorName: thread?.preview.authorName ?? "Citizen",
          authorScopeLabel: thread?.preview.authorScopeLabel ?? null,
          updatedAt: item.updatedAt,
          status: item.status,
          contextTitle: item.contextTitle,
          contextSubtitle: item.contextSubtitle,
          snippet: item.snippet,
        },
      };
    });
  }, [items, threadMap]);

  const handleNavigate = React.useCallback(
    (href: string) => {
      router.push(href, { scroll: false });
    },
    [router]
  );

  const handleClearSelection = React.useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "comments");
    params.delete("thread");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  if (loading) {
    return <div className="text-sm text-slate-500">Loading feedback...</div>;
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
    <CommentThreadAccordionList
      items={accordionItems}
      selectedThreadId={effectiveSelectedThreadId}
      onNavigate={handleNavigate}
      onClearSelection={handleClearSelection}
    />
  );
}
