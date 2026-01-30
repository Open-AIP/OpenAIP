import type { CommentStatus } from "../types";
import { COMMENT_STATUS_LABEL } from "../constants";

export function getCommentStatusBadge(status: CommentStatus) {
  if (status === "responded") {
    return {
      label: COMMENT_STATUS_LABEL.responded,
      className:
        "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50",
    };
  }

  return {
    label: COMMENT_STATUS_LABEL.no_response,
    className:
      "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50",
  };
}
