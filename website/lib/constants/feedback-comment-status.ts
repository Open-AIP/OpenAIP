import type { CommentThreadStatus } from "@/lib/types/domain/feedback.domain";

export const COMMENT_STATUS_LABEL: Record<CommentThreadStatus, string> = {
  no_response: "No response",
  responded: "Responded",
};
