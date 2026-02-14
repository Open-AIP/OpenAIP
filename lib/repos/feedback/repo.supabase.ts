import "server-only";

import { NotImplementedError } from "@/lib/core/errors";
import type { CommentRepo, FeedbackRepo, FeedbackThreadsRepo } from "./repo";

// [SUPABASE-SWAP] Future Supabase adapters for Feedback/Comments.
// [DBV2] Canonical table: `public.feedback` (root + replies via `parent_feedback_id`).
export function createSupabaseCommentRepo(): CommentRepo {
  return {
    async listThreadsForInbox() {
      // TODO(DBV2): list thread roots by scope/context from public.feedback (parent_feedback_id IS NULL).
      throw new NotImplementedError("Supabase comment repo not implemented yet.");
    },
    async getThread() {
      throw new NotImplementedError("Supabase comment repo not implemented yet.");
    },
    async listMessages() {
      // TODO(DBV2): list thread messages by root id from public.feedback.
      throw new NotImplementedError("Supabase comment repo not implemented yet.");
    },
    async createThread() {
      // TODO(DBV2): insert root feedback row with kind (question/suggestion/concern/commend).
      throw new NotImplementedError("Supabase comment repo not implemented yet.");
    },
    async addReply() {
      // TODO(DBV2): insert reply with kind='lgu_note' and parent_feedback_id set.
      throw new NotImplementedError("Supabase comment repo not implemented yet.");
    },
    async resolveThread() {
      throw new NotImplementedError("Supabase comment repo not implemented yet.");
    },
  };
}

export function createSupabaseFeedbackRepo(): FeedbackRepo {
  return {
    async listForAip() {
      throw new NotImplementedError("Supabase FeedbackRepo not implemented yet.");
    },
    async listForProject() {
      throw new NotImplementedError("Supabase FeedbackRepo not implemented yet.");
    },
    async createForAip() {
      throw new NotImplementedError("Supabase FeedbackRepo not implemented yet.");
    },
    async createForProject() {
      throw new NotImplementedError("Supabase FeedbackRepo not implemented yet.");
    },
    async reply() {
      throw new NotImplementedError("Supabase FeedbackRepo not implemented yet.");
    },
    async update() {
      throw new NotImplementedError("Supabase FeedbackRepo not implemented yet.");
    },
    async remove() {
      throw new NotImplementedError("Supabase FeedbackRepo not implemented yet.");
    },
  };
}

export function createSupabaseFeedbackThreadsRepo(): FeedbackThreadsRepo {
  return {
    async listThreadRootsByTarget() {
      throw new NotImplementedError(
        "Supabase FeedbackThreadsRepo not implemented yet."
      );
    },
    async listThreadMessages() {
      throw new NotImplementedError(
        "Supabase FeedbackThreadsRepo not implemented yet."
      );
    },
    async createRoot() {
      // TODO(DBV2): map kind -> public.feedback.kind
      throw new NotImplementedError(
        "Supabase FeedbackThreadsRepo not implemented yet."
      );
    },
    async createReply() {
      // TODO(DBV2): map kind -> public.feedback.kind (LGU replies should use kind='lgu_note')
      throw new NotImplementedError(
        "Supabase FeedbackThreadsRepo not implemented yet."
      );
    },
  };
}
