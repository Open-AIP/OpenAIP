import { CommentThreadListCard } from "@/components/feedback/comment-thread-list-card";
import type { FeedbackItem } from "@/features/citizen/aips/types";
import { getFeedbackKindBadge } from "@/lib/constants/feedback-kind";

export default function FeedbackListItem({ item }: { item: FeedbackItem }) {
  const badge = getFeedbackKindBadge(item.kind);
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
      badgeLabel={badge.label}
      badgeClassName={badge.className}
      onReply={() => console.log(item.id)}
    />
  );
}
