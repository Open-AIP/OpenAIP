import { COMMENT_MESSAGES_MOCK, COMMENT_THREADS_MOCK } from "@/features/feedback/mock";
import type { CommentMessage, CommentThread } from "@/features/feedback/types";
import type {
  CreateFeedbackInput,
  FeedbackItem,
  FeedbackRepo,
} from "./FeedbackRepo";

let feedbackStore: FeedbackItem[] = buildInitialStore(
  COMMENT_THREADS_MOCK,
  COMMENT_MESSAGES_MOCK
);
let feedbackSequence = feedbackStore.length + 1;

function buildInitialStore(
  threads: CommentThread[],
  messages: CommentMessage[]
): FeedbackItem[] {
  const store: FeedbackItem[] = [];

  for (const thread of threads) {
    const threadMessages = messages
      .filter((message) => message.threadId === thread.id)
      .sort(sortByCreatedAtAsc);

    const firstMessageId = threadMessages[0]?.id ?? null;

    for (const message of threadMessages) {
      store.push({
        id: message.id,
        targetType: thread.target.targetKind === "project" ? "project" : "aip",
        aipId: thread.target.targetKind === "aip_item" ? thread.target.aipId : null,
        projectId:
          thread.target.targetKind === "project" ? thread.target.projectId : null,
        parentFeedbackId:
          firstMessageId && message.id !== firstMessageId
            ? firstMessageId
            : null,
        kind: "question",
        body: message.text,
        authorId: message.authorId ?? null,
        createdAt: message.createdAt,
        updatedAt: message.createdAt,
        isPublic: true,
      });
    }
  }

  return store;
}

function sortByCreatedAtAsc(a: { createdAt: string }, b: { createdAt: string }) {
  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
}

function nextFeedbackId() {
  const id = `fbk_${String(feedbackSequence).padStart(3, "0")}`;
  feedbackSequence += 1;
  return id;
}

function removeWithReplies(items: FeedbackItem[], feedbackId: string) {
  const toRemove = new Set<string>();
  const queue = [feedbackId];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || toRemove.has(current)) continue;
    toRemove.add(current);
    for (const item of items) {
      if (item.parentFeedbackId === current) {
        queue.push(item.id);
      }
    }
  }

  return items.filter((item) => !toRemove.has(item.id));
}

// [DATAFLOW] Mock implementation of `FeedbackRepo` backed by an in-memory array.
// [DBV2] Supabase adapter should map `FeedbackItem` → `public.feedback` row and rely on RLS for published-only visibility and role/kind gates.
export function createMockFeedbackRepo(): FeedbackRepo {
  return {
    async listForAip(aipId: string): Promise<FeedbackItem[]> {
      return feedbackStore
        .filter((item) => item.targetType === "aip" && item.aipId === aipId)
        .sort(sortByCreatedAtAsc);
    },

    async listForProject(projectId: string): Promise<FeedbackItem[]> {
      return feedbackStore
        .filter(
          (item) => item.targetType === "project" && item.projectId === projectId
        )
        .sort(sortByCreatedAtAsc);
    },

    async createForAip(
      aipId: string,
      payload: CreateFeedbackInput
    ): Promise<FeedbackItem> {
      const now = new Date().toISOString();
      const item: FeedbackItem = {
        id: nextFeedbackId(),
        targetType: "aip",
        aipId,
        projectId: null,
        parentFeedbackId: null,
        kind: payload.kind,
        body: payload.body,
        authorId: payload.authorId ?? null,
        createdAt: now,
        updatedAt: now,
        isPublic: payload.isPublic ?? true,
      };

      feedbackStore = [...feedbackStore, item];
      return item;
    },

    async createForProject(
      projectId: string,
      payload: CreateFeedbackInput
    ): Promise<FeedbackItem> {
      const now = new Date().toISOString();
      const item: FeedbackItem = {
        id: nextFeedbackId(),
        targetType: "project",
        aipId: null,
        projectId,
        parentFeedbackId: null,
        kind: payload.kind,
        body: payload.body,
        authorId: payload.authorId ?? null,
        createdAt: now,
        updatedAt: now,
        isPublic: payload.isPublic ?? true,
      };

      feedbackStore = [...feedbackStore, item];
      return item;
    },

    async reply(
      parentFeedbackId: string,
      payload: CreateFeedbackInput
    ): Promise<FeedbackItem> {
      const parent = feedbackStore.find((item) => item.id === parentFeedbackId);
      if (!parent) {
        throw new Error(`Feedback parent not found: ${parentFeedbackId}`);
      }

      const now = new Date().toISOString();
      const item: FeedbackItem = {
        id: nextFeedbackId(),
        targetType: parent.targetType,
        aipId: parent.aipId,
        projectId: parent.projectId,
        parentFeedbackId: parent.id,
        kind: payload.kind,
        body: payload.body,
        authorId: payload.authorId ?? null,
        createdAt: now,
        updatedAt: now,
        isPublic: payload.isPublic ?? true,
      };

      feedbackStore = [...feedbackStore, item];
      return item;
    },

    async update(
      feedbackId: string,
      patch: Partial<Pick<FeedbackItem, "body" | "kind" | "isPublic">>
    ): Promise<FeedbackItem | null> {
      const index = feedbackStore.findIndex((item) => item.id === feedbackId);
      if (index === -1) {
        return null;
      }

      const current = feedbackStore[index];
      const updated: FeedbackItem = {
        ...current,
        ...patch,
        updatedAt: new Date().toISOString(),
      };

      feedbackStore = [
        ...feedbackStore.slice(0, index),
        updated,
        ...feedbackStore.slice(index + 1),
      ];

      return updated;
    },

    async remove(feedbackId: string): Promise<boolean> {
      const exists = feedbackStore.some((item) => item.id === feedbackId);
      if (!exists) {
        return false;
      }

      feedbackStore = removeWithReplies(feedbackStore, feedbackId);
      return true;
    },
  };
}
