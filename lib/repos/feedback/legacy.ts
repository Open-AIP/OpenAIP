import { createMockFeedbackThreadsRepo } from "./repo.mock";
import { mapFeedbackThreadToComment } from "./mappers";
import type {
  Comment,
  CommentProjectOption,
  CommentsFilterOptions,
  ListCommentsParams,
  ListCommentsResult,
  RespondToCommentInput,
} from "./types";
import { feedbackDebugLog } from "./debug";

const feedbackRepo = createMockFeedbackThreadsRepo();
let commentsStore: Comment[] = [];
let seeded = false;

async function ensureSeeded() {
  if (seeded) return;
  feedbackDebugLog("legacy.comments.service.ensureSeeded", {});
  const roots = await feedbackRepo.listThreadRootsByTarget({
    target_type: "project",
    project_id: null,
  });

  const comments = await Promise.all(
    roots.map(async (root) => {
      const thread = await feedbackRepo.listThreadMessages(root.id);
      return mapFeedbackThreadToComment(root, thread);
    })
  );

  commentsStore = comments;
  seeded = true;
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function sortByCreatedAtDesc(a: Comment, b: Comment) {
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
}

export async function getCommentsFilterOptions(): Promise<CommentsFilterOptions> {
  feedbackDebugLog("legacy.comments.service.getCommentsFilterOptions", {});
  await ensureSeeded();
  const yearsSet = new Set<number>();
  const projectsMap = new Map<string, CommentProjectOption>();

  for (const comment of commentsStore) {
    yearsSet.add(comment.year);
    if (!projectsMap.has(comment.project_id)) {
      projectsMap.set(comment.project_id, {
        project_id: comment.project_id,
        project_title: comment.project_title,
      });
    }
  }

  const years = Array.from(yearsSet).sort((a, b) => b - a);
  const projects = Array.from(projectsMap.values()).sort((a, b) =>
    a.project_title.localeCompare(b.project_title)
  );

  return { years, projects };
}

export async function listComments(params: ListCommentsParams = {}): Promise<ListCommentsResult> {
  feedbackDebugLog("legacy.comments.service.listComments", { params });
  await ensureSeeded();
  const year = params.year ?? "all";
  const projectId = params.projectId ?? "all";
  const status = params.status ?? "all";
  const q = params.q ? normalize(params.q) : "";

  const items = commentsStore
    .filter((comment) => {
      const yearOk = year === "all" ? true : comment.year === year;
      const projectOk = projectId === "all" ? true : comment.project_id === projectId;
      const statusOk = status === "all" ? true : comment.response_status === status;

      if (!yearOk || !projectOk || !statusOk) return false;

      if (!q) return true;

      const haystack = [comment.commenter_name, comment.message, comment.project_title]
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    })
    .sort(sortByCreatedAtDesc);

  return { items, total: items.length };
}

export async function respondToComment(input: RespondToCommentInput): Promise<Comment> {
  feedbackDebugLog("legacy.comments.service.respondToComment", { commentId: input.commentId });
  await ensureSeeded();
  const responseTimestamp = "2026-01-30T09:00:00.000Z";
  await feedbackRepo.createReply({
    parentId: input.commentId,
    body: input.message,
    authorId: input.responderName,
  });
  const index = commentsStore.findIndex((c) => c.id === input.commentId);

  if (index === -1) {
    return Promise.reject(new Error("Comment not found"));
  }

  const updated: Comment = {
    ...commentsStore[index],
    response_status: "responded",
    response: {
      responder_name: input.responderName,
      message: input.message,
      created_at: responseTimestamp,
    },
  };

  commentsStore = [...commentsStore.slice(0, index), updated, ...commentsStore.slice(index + 1)];

  return updated;
}

