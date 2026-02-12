import "server-only";

import { NotImplementedError } from "@/lib/core/errors";
import type { CommentRepo, FeedbackRepo, FeedbackThreadsRepo } from "./repo";

// [SUPABASE-SWAP] Future Supabase adapters for Feedback/Comments.
// [DBV2] Canonical table: `public.feedback` (root + replies via `parent_feedback_id`).
export function createSupabaseCommentRepo(): CommentRepo {
  return {
    async listThreadsForInbox() {
      throw new NotImplementedError("Supabase comment repo not implemented yet.");
    },
    async getThread() {
      throw new NotImplementedError("Supabase comment repo not implemented yet.");
    },
    async listMessages() {
      throw new NotImplementedError("Supabase comment repo not implemented yet.");
    },
    async addReply() {
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
      throw new NotImplementedError(
        "Supabase FeedbackThreadsRepo not implemented yet."
      );
    },
    async createReply() {
      throw new NotImplementedError(
        "Supabase FeedbackThreadsRepo not implemented yet."
      );
    },
  };
}
