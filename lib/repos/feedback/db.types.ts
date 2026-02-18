import type { FeedbackKind, FeedbackTargetType } from "@/lib/contracts/databasev2";

export type FeedbackThreadRow = {
  id: string;
  target_type: FeedbackTargetType;
  aip_id?: string | null;
  project_id?: string | null;
  parent_feedback_id?: string | null;
  kind: FeedbackKind;
  body: string;
  author_id: string | null;
  created_at: string;
};

export type FeedbackTarget = {
  target_type: FeedbackTargetType;
  aip_id?: string | null;
  project_id?: string | null;
};

export type CreateRootInput = {
  target: FeedbackTarget;
  body: string;
  kind: FeedbackKind;
  authorId: string | null;
};

export type CreateReplyInput = {
  parentId: string;
  body: string;
  kind: FeedbackKind;
  authorId: string | null;
  target?: FeedbackTarget;
};
