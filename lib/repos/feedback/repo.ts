import type { FeedbackKind, FeedbackTargetType } from "@/lib/contracts/databasev2";
import type { CreateReplyInput, CreateRootInput, FeedbackTarget, FeedbackThreadRow } from "./db.types";
import type { CommentAuthorRole, CommentMessage, CommentTarget, CommentThread } from "./types";
import { NotImplementedError } from "@/lib/core/errors";
import { selectRepo } from "@/lib/repos/_shared/selector";
import {
  createMockCommentRepo,
  createMockCommentTargetLookup,
  createMockFeedbackRepo,
  createMockFeedbackThreadsRepo,
} from "./repo.mock";

export type { Comment, CommentAuthorRole, CommentMessage, CommentSidebarItem, CommentTarget, CommentThread } from "./types";
export type { CreateReplyInput, CreateRootInput, FeedbackTarget, FeedbackThreadRow } from "./db.types";

export type ListThreadsForInboxParams = {
  lguId: string;
};

export type GetThreadParams = {
  threadId: string;
};

export type ListMessagesParams = {
  threadId: string;
};

export type AddReplyParams = {
  threadId: string;
  text: string;
};

export type CreateThreadParams = {
  target: CommentTarget;
  text: string;
  kind: FeedbackKind;
  authorId: string;
  authorRole: CommentAuthorRole;
  authorName?: string;
  authorScopeLabel?: string | null;
};

export type ResolveThreadParams = {
  threadId: string;
};

// [DATAFLOW] UI components call this repo to list threads/messages and post replies.
// [DBV2] Canonical persistence is `public.feedback` (thread root + replies via `parent_feedback_id`).
export type CommentRepo = {
  listThreadsForInbox: (params: ListThreadsForInboxParams) => Promise<CommentThread[]>;
  getThread: (params: GetThreadParams) => Promise<CommentThread | null>;
  listMessages: (params: ListMessagesParams) => Promise<CommentMessage[]>;
  createThread: (params: CreateThreadParams) => Promise<CommentThread>;
  addReply: (params: AddReplyParams) => Promise<CommentMessage>;
  resolveThread?: (params: ResolveThreadParams) => Promise<void>;
};

export type CommentTargetProjectSummary = {
  id: string;
  title: string;
  year?: number;
  kind?: "health" | "infrastructure";
};

export type CommentTargetAipSummary = {
  id: string;
  title: string;
  year?: number;
  barangayName?: string | null;
};

export type CommentTargetAipItemSummary = {
  id: string;
  aipId: string;
  projectRefCode?: string;
  aipDescription: string;
};

export type CommentTargetLookup = {
  getProject: (id: string) => Promise<CommentTargetProjectSummary | null>;
  getAip: (id: string) => Promise<CommentTargetAipSummary | null>;
  getAipItem: (
    aipId: string,
    aipItemId: string
  ) => Promise<CommentTargetAipItemSummary | null>;
  findAipItemByProjectRefCode?: (
    projectRefCode: string
  ) => Promise<CommentTargetAipItemSummary | null>;
};

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

// [DATAFLOW] DBV2-aligned repository shape: one `FeedbackItem` maps to one row in `public.feedback`.
export interface FeedbackRepo {
  listForAip(aipId: string): Promise<FeedbackItem[]>;
  listForProject(projectId: string): Promise<FeedbackItem[]>;
  createForAip(aipId: string, payload: CreateFeedbackInput): Promise<FeedbackItem>;
  createForProject(projectId: string, payload: CreateFeedbackInput): Promise<FeedbackItem>;
  reply(parentFeedbackId: string, payload: CreateFeedbackInput): Promise<FeedbackItem>;
  update(
    feedbackId: string,
    patch: Partial<Pick<FeedbackItem, "body" | "kind" | "isPublic">>
  ): Promise<FeedbackItem | null>;
  remove(feedbackId: string): Promise<boolean>;
}

// [DATAFLOW] Threaded repository interface that mirrors DBV2 `public.feedback` rows (root + replies).
export interface FeedbackThreadsRepo {
  listThreadRootsByTarget(target: FeedbackTarget): Promise<FeedbackThreadRow[]>;
  listThreadMessages(rootId: string): Promise<FeedbackThreadRow[]>;
  createRoot(input: CreateRootInput): Promise<FeedbackThreadRow>;
  createReply(input: CreateReplyInput): Promise<FeedbackThreadRow>;
}

export function getCommentRepo(): CommentRepo {
  return selectRepo({
    label: "CommentRepo",
    mock: () => createMockCommentRepo(),
    supabase: () => {
      throw new NotImplementedError(
        "CommentRepo is server-only outside mock mode. Import from `@/lib/repos/feedback/repo.server`."
      );
    },
  });
}

export function getCommentTargetLookup(): CommentTargetLookup {
  return selectRepo({
    label: "CommentTargetLookup",
    mock: () => createMockCommentTargetLookup(),
    supabase: () => {
      throw new NotImplementedError(
        "CommentTargetLookup is server-only outside mock mode. Import from `@/lib/repos/feedback/repo.server`."
      );
    },
  });
}

export function getFeedbackRepo(): FeedbackRepo {
  return selectRepo({
    label: "FeedbackRepo",
    mock: () => createMockFeedbackRepo(),
    supabase: () => {
      throw new NotImplementedError(
        "FeedbackRepo is server-only outside mock mode. Import from `@/lib/repos/feedback/repo.server`."
      );
    },
  });
}

export function getFeedbackThreadsRepo(): FeedbackThreadsRepo {
  return selectRepo({
    label: "FeedbackThreadsRepo",
    mock: () => createMockFeedbackThreadsRepo(),
    supabase: () => {
      throw new NotImplementedError(
        "FeedbackThreadsRepo is server-only outside mock mode. Import from `@/lib/repos/feedback/repo.server`."
      );
    },
  });
}
