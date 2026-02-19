export const COMMENT_THREAD_HIGHLIGHT_CLASSNAME =
  "ring-2 ring-amber-400 ring-inset";

export function getCommentThreadHighlightClassName({
  threadId,
  selectedThreadId,
}: {
  threadId: string;
  selectedThreadId?: string | null;
}) {
  if (!selectedThreadId) return "";
  return threadId === selectedThreadId
    ? COMMENT_THREAD_HIGHLIGHT_CLASSNAME
    : "";
}

