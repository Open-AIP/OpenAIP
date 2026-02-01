import type {
  CreateFeedbackInput,
  FeedbackItem,
  FeedbackRepo,
} from "./FeedbackRepo";

export function createSupabaseFeedbackRepo(): FeedbackRepo {
  return {
    async listForAip(_aipId: string): Promise<FeedbackItem[]> {
      throw new Error("Not implemented");
    },

    async listForProject(_projectId: string): Promise<FeedbackItem[]> {
      throw new Error("Not implemented");
    },

    async createForAip(
      _aipId: string,
      _payload: CreateFeedbackInput
    ): Promise<FeedbackItem> {
      throw new Error("Not implemented");
    },

    async createForProject(
      _projectId: string,
      _payload: CreateFeedbackInput
    ): Promise<FeedbackItem> {
      throw new Error("Not implemented");
    },

    async reply(
      _parentFeedbackId: string,
      _payload: CreateFeedbackInput
    ): Promise<FeedbackItem> {
      throw new Error("Not implemented");
    },

    async update(
      _feedbackId: string,
      _patch: Partial<Pick<FeedbackItem, "body" | "kind" | "isPublic">>
    ): Promise<FeedbackItem | null> {
      throw new Error("Not implemented");
    },

    async remove(_feedbackId: string): Promise<boolean> {
      throw new Error("Not implemented");
    },
  };
}
