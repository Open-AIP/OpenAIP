import { CommentThreadListCard } from "@/features/feedback/components/comment-thread-list-card";
import type { FeedbackCategory, FeedbackItem } from "@/features/citizen/aips/types";

const CATEGORY_BADGE_STYLES: Record<FeedbackCategory, string> = {
  Question: "border-slate-200 text-slate-600",
  Concern: "border-rose-200 text-rose-600",
  Suggestion: "border-amber-200 text-amber-700",
  Commendation: "border-emerald-200 text-emerald-600",
};

export default function FeedbackListItem({ item }: { item: FeedbackItem }) {
  return (
    <CommentThreadListCard
      authorName={item.authorName}
      authorScopeLabel={item.barangayName}
      updatedAt={item.createdAt}
      status="no_response"
      contextTitle="AIP Detail"
      contextSubtitle="Citizen Feedback"
      contextLine={item.contextLine}
      snippet={item.content}
      badgeLabel={item.category}
      badgeClassName={CATEGORY_BADGE_STYLES[item.category]}
      onReply={() => console.log(item.id)}
    />
  );
}
