import type { Comment } from "./types";
import type { FeedbackThreadRow } from "./repo";

export function dedupeByKey<T>(items: T[], getKey: (item: T) => string): T[] {
  const seen = new Set<string>();
  const unique: T[] = [];

  for (const item of items) {
    const key = getKey(item);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
  }

  return unique;
}

export function findDuplicateKeys<T>(items: T[], getKey: (item: T) => string): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const item of items) {
    const key = getKey(item);
    if (seen.has(key)) {
      duplicates.add(key);
    } else {
      seen.add(key);
    }
  }

  return Array.from(duplicates);
}

export function mapFeedbackThreadToComment(root: FeedbackThreadRow, threadMessages: FeedbackThreadRow[]): Comment {
  const replies = threadMessages.filter((row) => row.parent_feedback_id === root.id);
  const oldestReply = replies.sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )[0];

  const createdAt = root.created_at;
  const year = new Date(createdAt).getUTCFullYear();

  return {
    id: root.id,
    year,
    project_id: root.project_id ?? "unknown",
    project_title: "Unknown project",
    commenter_name: root.author_id ?? "Unknown commenter",
    commenter_scope_label: "Unknown",
    message: root.body,
    created_at: createdAt,
    response_status: oldestReply ? "responded" : "no_response",
    response: oldestReply
      ? {
          responder_name: oldestReply.author_id ?? "Unknown responder",
          message: oldestReply.body,
          created_at: oldestReply.created_at,
        }
      : null,
  };
}
