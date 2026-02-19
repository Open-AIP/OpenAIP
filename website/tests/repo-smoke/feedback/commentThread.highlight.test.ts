import {
  COMMENT_THREAD_HIGHLIGHT_CLASSNAME,
  getCommentThreadHighlightClassName,
} from "@/features/feedback/components/comment-thread-highlight";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

export async function runCommentThreadHighlightTests() {
  const threadIds = ["t1", "t2", "t3"];

  const selected = "t2";
  const classNames = threadIds.map((threadId) =>
    getCommentThreadHighlightClassName({ threadId, selectedThreadId: selected })
  );

  assert(
    classNames.filter((c) => c.includes("ring-2")).length === 1,
    "Expected exactly 1 highlighted thread"
  );
  assert(
    classNames[1] === COMMENT_THREAD_HIGHLIGHT_CLASSNAME,
    "Expected selected thread to receive highlight class"
  );

  const none = threadIds.map((threadId) =>
    getCommentThreadHighlightClassName({ threadId, selectedThreadId: undefined })
  );
  assert(none.every((c) => c === ""), "Expected no highlighted thread when selectedThreadId is undefined");
}

