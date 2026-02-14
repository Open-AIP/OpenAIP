"use client";

import { useMemo, useState } from "react";
import {
  CommentThreadAccordionList,
  type CommentThreadAccordionItem,
} from "@/features/feedback/components/comment-thread-accordion-list";
import { CommentThreadPanel } from "@/features/feedback/components/comment-thread-panel";
import type {
  FeedbackCategory,
  FeedbackItem,
  FeedbackUser,
} from "@/features/citizen/aips/types";

const CATEGORY_BADGE_STYLES: Record<FeedbackCategory, string> = {
  Question: "border-slate-200 text-slate-600",
  Concern: "border-rose-200 text-rose-600",
  Suggestion: "border-amber-200 text-amber-700",
  Commendation: "border-emerald-200 text-emerald-600",
};

type Props = {
  aipId: string;
  items: FeedbackItem[];
  isAuthenticated: boolean;
  currentUser?: FeedbackUser | null;
};

export default function AipFeedbackTab(props: Props) {
  const { items } = props;
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);

  const accordionItems: CommentThreadAccordionItem[] = useMemo(
    () =>
      items.map((item) => ({
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
          badgeLabel: item.category,
          badgeClassName: CATEGORY_BADGE_STYLES[item.category],
        },
      })),
    [items]
  );

  if (accordionItems.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
        No feedback for this AIP yet.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CommentThreadAccordionList
        items={accordionItems}
        selectedThreadId={selectedThreadId}
        onNavigate={(threadId) => setSelectedThreadId(threadId)}
        onClearSelection={() => setSelectedThreadId(null)}
        renderExpandedContent={(threadId) => (
          <CommentThreadPanel threadId={threadId} variant="embedded" mode="citizen" />
        )}
      />
    </div>
  );
}
