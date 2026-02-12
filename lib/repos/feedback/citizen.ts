import { getCommentRepo, getCommentTargetLookup } from "@/lib/repos/feedback/repo";
import { resolveCommentSidebar } from "@/lib/repos/feedback/queries";
import type { CommentThread } from "@/lib/repos/feedback/types";
import { CITIZEN_FEEDBACK_CATEGORY_BY_THREAD_ID } from "@/mocks/fixtures/feedback/citizen-feedback.fixture";

export type FeedbackCategory = "Question" | "Concern" | "Suggestion" | "Commendation";

export type FeedbackItem = {
  id: string;
  authorName: string;
  barangayName: string;
  createdAt: string;
  content: string;
  category: FeedbackCategory;
  contextLine?: string;
  replyCount?: number;
};

export type FeedbackUser = {
  name: string;
  barangayName: string;
};

const sortByUpdatedAtDesc = (a: CommentThread, b: CommentThread) =>
  new Date(b.preview.updatedAt).getTime() - new Date(a.preview.updatedAt).getTime();

const toCategory = (threadId: string): FeedbackCategory =>
  CITIZEN_FEEDBACK_CATEGORY_BY_THREAD_ID[threadId] ?? "Question";

export async function listCitizenFeedbackItems(aipId: string): Promise<FeedbackItem[]> {
  const repo = getCommentRepo();
  const lookup = getCommentTargetLookup();
  const threads = await repo.listThreadsForInbox({ lguId: "lgu_barangay_001" });

  const aipThreads = threads.filter(
    (thread) => thread.target.targetKind === "aip_item" && thread.target.aipId === aipId
  );

  const remainingThreads = threads.filter((thread) => !aipThreads.includes(thread));
  const sortedAipThreads = [...aipThreads].sort(sortByUpdatedAtDesc);
  const sortedRemaining = [...remainingThreads].sort(sortByUpdatedAtDesc);

  const selected =
    sortedAipThreads.length >= 4
      ? sortedAipThreads.slice(0, 4)
      : [...sortedAipThreads, ...sortedRemaining.slice(0, 4 - sortedAipThreads.length)];

  const resolved = await resolveCommentSidebar({
    threads: selected,
    scope: "city",
    ...lookup,
  });

  const resolvedMap = new Map(resolved.map((item) => [item.threadId, item]));

  return selected.map((thread) => {
    const context = resolvedMap.get(thread.id);
    const contextLine =
      context && thread.target.targetKind === "aip_item"
        ? `Submitted feedback on the ${context.contextTitle}`
        : undefined;

    return {
      id: thread.id,
      authorName: thread.preview.authorName ?? "Citizen",
      barangayName: thread.preview.authorScopeLabel ?? "Barangay",
      createdAt: thread.preview.updatedAt,
      content: thread.preview.text,
      category: toCategory(thread.id),
      contextLine,
    };
  });
}
