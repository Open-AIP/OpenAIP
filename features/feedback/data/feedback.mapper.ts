import type { FeedbackRow } from "./feedback.types";
import type { Comment } from "../types";

export function mapFeedbackThreadToComment(
  root: FeedbackRow,
  threadMessages: FeedbackRow[]
): Comment {
  const replies = threadMessages.filter((row) => row.parent_feedback_id === root.id);
  const oldestReply = replies.sort((a, b) =>
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )[0];

  const createdAt = root.created_at;
  const year = new Date(createdAt).getUTCFullYear();

  return {
    id: root.id,
    year,
    project_id: root.project_id ?? "unknown",
    project_title: "Unknown project",
    commenter_name: root.author_id,
    commenter_scope_label: "Unknown",
    message: root.body,
    created_at: createdAt,
    response_status: oldestReply ? "responded" : "no_response",
    response: oldestReply
      ? {
          responder_name: oldestReply.author_id,
          message: oldestReply.body,
          created_at: oldestReply.created_at,
        }
      : null,
  };
}
