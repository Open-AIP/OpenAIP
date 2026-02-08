import type { CommentRepo, FeedbackRepo, FeedbackThreadsRepo } from "./repo";

// [SUPABASE-SWAP] Future Supabase adapters for Feedback/Comments.
export function createSupabaseCommentRepo(): CommentRepo {
  return {
    async listThreadsForInbox() {
      throw new Error("Supabase comment repo not implemented yet.");
    },
    async getThread() {
      throw new Error("Supabase comment repo not implemented yet.");
    },
    async listMessages() {
      throw new Error("Supabase comment repo not implemented yet.");
    },
    async addReply() {
      throw new Error("Supabase comment repo not implemented yet.");
    },
    async resolveThread() {
      throw new Error("Supabase comment repo not implemented yet.");
    },
  };
}

export function createSupabaseFeedbackRepo(): FeedbackRepo {
  return {
    async listForAip() {
      throw new Error("Not implemented");
    },
    async listForProject() {
      throw new Error("Not implemented");
    },
    async createForAip() {
      throw new Error("Not implemented");
    },
    async createForProject() {
      throw new Error("Not implemented");
    },
    async reply() {
      throw new Error("Not implemented");
    },
    async update() {
      throw new Error("Not implemented");
    },
    async remove() {
      throw new Error("Not implemented");
    },
  };
}

export function createSupabaseFeedbackThreadsRepo(): FeedbackThreadsRepo {
  return {
    async listThreadRootsByTarget() {
      throw new Error("Not implemented");
    },
    async listThreadMessages() {
      throw new Error("Not implemented");
    },
    async createRoot() {
      throw new Error("Not implemented");
    },
    async createReply() {
      throw new Error("Not implemented");
    },
  };
}
