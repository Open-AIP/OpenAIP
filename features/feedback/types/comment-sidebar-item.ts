import type { CommentThreadStatus } from "./comment-thread";

export type CommentSidebarItem = {
  threadId: string;
  snippet: string;
  updatedAt: string;
  status: CommentThreadStatus;
  contextTitle: string;
  contextSubtitle: string;
  href: string;
};
