"use client";

import * as React from "react";
import { cn } from "@/ui/utils";

import { CommentThreadPanel } from "./comment-thread-panel";
import { getCommentThreadHighlightClassName } from "./comment-thread-highlight";
import { CommentThreadListCard } from "./comment-thread-list-card";

type CardProps = Omit<
  React.ComponentProps<typeof CommentThreadListCard>,
  "variant" | "className"
>;

export type CommentThreadAccordionItem = {
  threadId: string;
  href: string;
  card: CardProps;
};

export function CommentThreadAccordionList({
  items,
  selectedThreadId,
  onNavigate,
  onClearSelection,
  renderExpandedContent,
}: {
  items: CommentThreadAccordionItem[];
  selectedThreadId?: string | null;
  onNavigate: (href: string) => void;
  onClearSelection: () => void;
  renderExpandedContent?: (threadId: string) => React.ReactNode;
}) {
  const rowRefs = React.useRef(new Map<string, HTMLDivElement | null>());
  const setRowRef = React.useCallback(
    (threadId: string) => (node: HTMLDivElement | null) => {
      rowRefs.current.set(threadId, node);
    },
    []
  );

  React.useEffect(() => {
    if (!selectedThreadId) return;
    const node = rowRefs.current.get(selectedThreadId);
    if (!node) return;
    requestAnimationFrame(() => {
      node.scrollIntoView({ block: "center" });
    });
  }, [selectedThreadId]);

  const renderExpanded =
    renderExpandedContent ??
    ((threadId: string) => (
      <CommentThreadPanel threadId={threadId} variant="embedded" />
    ));

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const isSelected = item.threadId === selectedThreadId;
        const highlightClass = getCommentThreadHighlightClassName({
          threadId: item.threadId,
          selectedThreadId,
        });

        return (
          <div
            key={item.threadId}
            ref={setRowRef(item.threadId)}
            className={cn(
              "rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm",
              highlightClass
            )}
            data-thread-id={item.threadId}
            data-thread-expanded={isSelected ? "true" : "false"}
          >
            <button
              type="button"
              className="block w-full text-left"
              aria-expanded={isSelected}
              onClick={() => {
                if (isSelected) {
                  onClearSelection();
                  return;
                }
                onNavigate(item.href);
              }}
            >
              <CommentThreadListCard {...item.card} variant="embedded" />
            </button>

            {isSelected ? (
              <div className="mt-4 min-w-0">{renderExpanded(item.threadId)}</div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
