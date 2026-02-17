import type { FeedbackKind } from "@/lib/contracts/databasev2";

export type CommentAuthorRole =
  | "citizen"
  | "barangay_official"
  | "city_official"
  | "admin";

export type CommentMessage = {
  id: string;
  threadId: string;
  authorRole: CommentAuthorRole;
  authorId: string;
  kind: FeedbackKind;
  text: string;
  createdAt: string;
};

export type ProjectCommentTarget = {
  targetKind: "project";
  projectId: string;
};

export type AipCommentTarget = {
  targetKind: "aip";
  aipId: string;
};

export type AipItemCommentTarget = {
  targetKind: "aip_item";
  aipId: string;
  aipItemId: string;
};

export type CommentTarget = ProjectCommentTarget | AipCommentTarget | AipItemCommentTarget;

export type CommentThreadStatus = "no_response" | "responded";

export type CommentThreadPreview = {
  text: string;
  updatedAt: string;
  status: CommentThreadStatus;
  kind: FeedbackKind;
  authorName?: string;
  authorScopeLabel?: string | null;
};

export type CommentThread = {
  id: string;
  createdAt: string;
  createdByUserId: string;
  target: CommentTarget;
  preview: CommentThreadPreview;
};

export type CommentSidebarItem = {
  threadId: string;
  snippet: string;
  updatedAt: string;
  status: CommentThreadStatus;
  contextTitle: string;
  contextSubtitle: string;
  href: string;
};

export type CommentResponse = {
  responder_name: string;
  message: string;
  created_at: string;
};

export type Comment = {
  id: string;
  year: number;
  project_id: string;
  project_title: string;
  commenter_name: string;
  commenter_scope_label: string;
  message: string;
  created_at: string;
  response_status: "no_response" | "responded";
  response?: CommentResponse | null;
};

export type CommentProjectOption = {
  project_id: string;
  project_title: string;
};

export type CommentsFilterOptions = {
  years: number[];
  projects: CommentProjectOption[];
};
