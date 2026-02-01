import type { FeedbackKind } from "@/lib/contracts/databasev2";

export type FeedbackTargetType = "aip" | "project";

export type FeedbackItem = {
  id: string;
  targetType: FeedbackTargetType;
  aipId: string | null;
  projectId: string | null;
  parentFeedbackId: string | null;
  kind: FeedbackKind;
  body: string;
  authorId: string | null;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
};

export type CreateFeedbackInput = {
  kind: FeedbackKind;
  body: string;
  authorId?: string | null;
  isPublic?: boolean;
};

export interface FeedbackRepo {
  listForAip(aipId: string): Promise<FeedbackItem[]>;
  listForProject(projectId: string): Promise<FeedbackItem[]>;
  createForAip(aipId: string, payload: CreateFeedbackInput): Promise<FeedbackItem>;
  createForProject(
    projectId: string,
    payload: CreateFeedbackInput
  ): Promise<FeedbackItem>;
  reply(
    parentFeedbackId: string,
    payload: CreateFeedbackInput
  ): Promise<FeedbackItem>;
  update(
    feedbackId: string,
    patch: Partial<Pick<FeedbackItem, "body" | "kind" | "isPublic">>
  ): Promise<FeedbackItem | null>;
  remove(feedbackId: string): Promise<boolean>;
}
