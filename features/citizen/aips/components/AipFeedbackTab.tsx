"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CommentThreadAccordionList,
  type CommentThreadAccordionItem,
} from "@/features/feedback/components/comment-thread-accordion-list";
import { CommentThreadPanel } from "@/features/feedback/components/comment-thread-panel";
import FeedbackComposer from "@/features/citizen/aips/components/FeedbackComposer";
import { getFeedbackKindBadge } from "@/features/feedback/lib/kind";
import type {
  FeedbackItem,
  FeedbackUser,
} from "@/features/citizen/aips/types";
import { createCitizenFeedback } from "@/lib/repos/feedback/citizen";

type Props = {
  aipId: string;
  items: FeedbackItem[];
  isAuthenticated: boolean;
  currentUser?: FeedbackUser | null;
};

export default function AipFeedbackTab(props: Props) {
  const { aipId, items, isAuthenticated, currentUser } = props;
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [threadItems, setThreadItems] = useState<FeedbackItem[]>(items);

  useEffect(() => {
    setThreadItems(items);
  }, [items]);

  const handleSubmit = async (input: { message: string; kind: FeedbackItem["kind"] }) => {
    if (!currentUser) return;
    try {
      const created = await createCitizenFeedback({
        aipId,
        message: input.message,
        kind: input.kind,
        user: currentUser,
      });
      setThreadItems((prev) => [created, ...prev]);
      setSelectedThreadId(created.id);
    } catch (error) {
      console.error(error);
    }
  };

  const accordionItems: CommentThreadAccordionItem[] = useMemo(
    () =>
      threadItems.map((item) => {
        const badge = getFeedbackKindBadge(item.kind);
        return {
        threadId: item.id,
        href: item.id,
        card: {
          authorName: item.authorName,
          authorScopeLabel: item.barangayName,
          updatedAt: item.createdAt,
          status: "no_response" as const,
          contextTitle: "AIP Detail",
          contextSubtitle: "Citizen Feedback",
          contextLine: item.contextLine,
          snippet: item.content,
          badgeLabel: badge.label,
          badgeClassName: badge.className,
        },
      };
      }),
    [threadItems]
  );

  return (
    <div className="space-y-6">
      {isAuthenticated && currentUser ? (
        <FeedbackComposer currentUser={currentUser} onSubmit={handleSubmit} />
      ) : null}
      {accordionItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
          No feedback for this AIP yet.
        </div>
      ) : (
        <CommentThreadAccordionList
          items={accordionItems}
          selectedThreadId={selectedThreadId}
          onNavigate={(threadId) => setSelectedThreadId(threadId)}
          onClearSelection={() => setSelectedThreadId(null)}
          renderExpandedContent={(threadId) => (
            <CommentThreadPanel threadId={threadId} variant="embedded" mode="citizen" />
          )}
        />
      )}
    </div>
  );
}
