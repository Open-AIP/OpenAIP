import type { Comment } from "../types";
import type { FeedbackRow } from "./feedback.types";

type MetadataMap = Map<string, Comment>;

export function mapFeedbackThreadToComment(
  root: FeedbackRow,
  threadMessages: FeedbackRow[],
  metadata: MetadataMap
): Comment {
  const base = metadata.get(root.id);
  const replies = threadMessages.filter((row) => row.parent_feedback_id === root.id);
  const oldestReply = replies.sort((a, b) =>
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )[0];

  if (base) {
    if (!oldestReply) {
      return { ...base, response_status: "no_response", response: null };
    }

    return {
      ...base,
      response_status: "responded",
      response: {
        responder_name: oldestReply.author_id,
        message: oldestReply.body,
        created_at: oldestReply.created_at,
      },
    };
  }

  const createdAt = root.created_at;
  const year = new Date(createdAt).getUTCFullYear();

  return {
    id: root.id,
    year,
    project_id: root.project_id ?? "unknown",
    project_title: "Unknown project",
    commenter_name: root.author_id,
    commenter_scope_label: null,
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
