import type {
  FeedbackKind,
  FeedbackSource,
  FeedbackTargetType,
} from "../enums";
import type { ISODateTime, UUID } from "../primitives";

/**
 * Base columns shared by both target shapes.
 */
type FeedbackRowBase = {
  id: UUID;

  target_type: FeedbackTargetType;

  /** reply threading */
  parent_feedback_id: UUID | null;

  /** human vs ai */
  source: FeedbackSource;

  /** question/suggestion/concern/lgu_note/ai_finding/commend */
  kind: FeedbackKind;

  extraction_run_id: UUID | null;
  extraction_artifact_id: UUID | null;

  field_key: string | null;

  /**
   * DB constraint: severity int null check (1..5).
   * Types can't enforce numeric ranges; keep as number|null.
   */
  severity: number | null;

  body: string;

  /** visibility flag used by RLS gates */
  is_public: boolean;

  /**
   * DB rule:
   * - source='ai' => author_id must be null
   * - source='human' => author_id must be not null
   */
  author_id: UUID | null;

  created_at: ISODateTime;
  updated_at: ISODateTime;
};

/**
 * Target XOR:
 * - if target_type='aip' => aip_id not null, project_id null
 * - if target_type='project' => project_id not null, aip_id null
 */
export type FeedbackRow =
  | (FeedbackRowBase & {
      target_type: "aip";
      aip_id: UUID;
      project_id: null;
    })
  | (FeedbackRowBase & {
      target_type: "project";
      aip_id: null;
      project_id: UUID;
    });

/**
 * Narrow helper shapes if you want stricter author typing.
 * Optional but useful (still additive).
 */
export type HumanFeedbackRow = FeedbackRow & {
  source: "human";
  author_id: UUID;
};

export type AiFeedbackRow = FeedbackRow & {
  source: "ai";
  author_id: null;
};
