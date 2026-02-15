import { getCommentRepo, getCommentTargetLookup } from "@/lib/repos/feedback/repo";
import { resolveCommentSidebar } from "@/lib/repos/feedback/queries";
import type { CommentThread } from "@/lib/repos/feedback/types";
import type { FeedbackKind } from "@/lib/contracts/databasev2";

export type FeedbackCategoryKind = Extract<
  FeedbackKind,
  "question" | "suggestion" | "concern" | "commend"
>;

export type FeedbackItem = {
  id: string;
  authorName: string;
  barangayName: string;
  createdAt: string;
  content: string;
  kind: FeedbackCategoryKind;
  contextLine?: string;
  replyCount?: number;
};

export type FeedbackUser = {
  name: string;
  barangayName: string;
};

export async function getCitizenFeedbackSession(): Promise<{
  isAuthenticated: boolean;
  currentUser: FeedbackUser | null;
}> {
  const { CITIZEN_FEEDBACK_AUTH, CITIZEN_FEEDBACK_USER } = await import(
    "@/mocks/fixtures/feedback/citizen-feedback.fixture"
  );

  return {
    isAuthenticated: CITIZEN_FEEDBACK_AUTH,
    currentUser: CITIZEN_FEEDBACK_AUTH ? CITIZEN_FEEDBACK_USER : null,
  };
}

const sortByUpdatedAtDesc = (a: CommentThread, b: CommentThread) =>
  new Date(b.preview.updatedAt).getTime() - new Date(a.preview.updatedAt).getTime();

const CATEGORY_KINDS: FeedbackCategoryKind[] = [
  "commend",
  "suggestion",
  "question",
  "concern",
];

const isCategoryKind = (kind: FeedbackKind): kind is FeedbackCategoryKind =>
  CATEGORY_KINDS.includes(kind as FeedbackCategoryKind);

export async function listCitizenFeedbackItems(aipId: string): Promise<FeedbackItem[]> {
  const repo = getCommentRepo();
  const lookup = getCommentTargetLookup();
  const threads = await repo.listThreadsForInbox({ lguId: "lgu_barangay_001" });

  const aipThreads = threads.filter((thread) => {
    if (thread.target.targetKind === "aip_item" && thread.target.aipId === aipId) {
      return true;
    }
    return thread.target.targetKind === "aip" && thread.target.aipId === aipId;
  });

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
      context && (thread.target.targetKind === "aip_item" || thread.target.targetKind === "aip")
        ? `Submitted feedback on the ${context.contextTitle}`
        : undefined;

    return {
      id: thread.id,
      authorName: thread.preview.authorName ?? "Citizen",
      barangayName: thread.preview.authorScopeLabel ?? "Barangay",
      createdAt: thread.preview.updatedAt,
      content: thread.preview.text,
      kind: isCategoryKind(thread.preview.kind) ? thread.preview.kind : "question",
      contextLine,
    };
  });
}

export async function createCitizenFeedback({
  aipId,
  message,
  kind,
  user,
}: {
  aipId: string;
  message: string;
  kind: FeedbackCategoryKind;
  user: FeedbackUser;
}): Promise<FeedbackItem> {
  const repo = getCommentRepo();
  const authorId = user.name.trim().toLowerCase().replace(/\s+/g, "_");
  const thread = await repo.createThread({
    target: { targetKind: "aip", aipId },
    text: message,
    kind,
    authorId,
    authorRole: "citizen",
    authorName: user.name,
    authorScopeLabel: user.barangayName,
  });

  return {
    id: thread.id,
    authorName: thread.preview.authorName ?? user.name,
    barangayName: thread.preview.authorScopeLabel ?? user.barangayName,
    createdAt: thread.preview.updatedAt,
    content: thread.preview.text,
    kind,
    contextLine: "Submitted feedback on the AIP",
  };
}
