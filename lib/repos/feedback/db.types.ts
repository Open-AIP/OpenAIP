import type {
  FeedbackKind,
  FeedbackSource,
  FeedbackTargetType,
  FeedbackRow,
} from "@/lib/contracts/databasev2";

export type FeedbackThreadRow = FeedbackRow;

export type FeedbackTarget = {
  target_type: FeedbackTargetType;
  aip_id?: string | null;
  project_id?: string | null;
  /**
   * Optional row-level identifier for AIP item feedback.
   * Maps to dbv2 `feedback.field_key`.
   */
  field_key?: string | null;
};

export type CreateRootInput = {
  target: FeedbackTarget;
  body: string;
  kind: FeedbackKind;
  authorId: string | null;
  source?: FeedbackSource;
  isPublic?: boolean;
  extractionRunId?: string | null;
  extractionArtifactId?: string | null;
  severity?: number | null;
};

export type CreateReplyInput = {
  parentId: string;
  body: string;
  kind: FeedbackKind;
  authorId: string | null;
  source?: FeedbackSource;
  isPublic?: boolean;
  target?: FeedbackTarget;
};
