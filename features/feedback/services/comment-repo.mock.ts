import type {
  AddReplyParams,
  CommentRepo,
  GetThreadParams,
  ListMessagesParams,
  ListThreadsForInboxParams,
  ResolveThreadParams,
} from "./comment-repo";
import type { CommentMessage, CommentThread } from "../types";
import { COMMENT_MESSAGES_MOCK, COMMENT_THREADS_MOCK } from "../mock";
import { validateMockIds } from "@/features/shared/mock/validate-mock-ids";
import { feedbackDebugLog } from "../lib/debug";
import { dedupeByKey, findDuplicateKeys } from "./dedupe";

let threadStore: CommentThread[] = [...COMMENT_THREADS_MOCK];
let messageStore: CommentMessage[] = [...COMMENT_MESSAGES_MOCK];
let messageSequence = messageStore.length + 1;
let mockIdsValidated = false;

function sortByUpdatedAtDesc(a: CommentThread, b: CommentThread) {
  return (
    new Date(b.preview.updatedAt).getTime() -
    new Date(a.preview.updatedAt).getTime()
  );
}

function sortByCreatedAtAsc(a: CommentMessage, b: CommentMessage) {
  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
}

export function createMockCommentRepo(): CommentRepo {
  if (!mockIdsValidated && process.env.NODE_ENV !== "production") {
    validateMockIds();
    mockIdsValidated = true;
  }

  return {
    async listThreadsForInbox(
      _params: ListThreadsForInboxParams
    ): Promise<CommentThread[]> {
      const sorted = [...threadStore].sort(sortByUpdatedAtDesc);
      const duplicates = findDuplicateKeys(sorted, (thread) => thread.id);
      const unique = dedupeByKey(sorted, (thread) => thread.id);

      if (duplicates.length > 0) {
        feedbackDebugLog("threaded.listThreadsForInbox duplicates", {
          count: duplicates.length,
          ids: duplicates,
        });
      }

      feedbackDebugLog("threaded.listThreadsForInbox", {
        count: unique.length,
        ids: unique.map((t) => t.id),
      });

      return unique;
    },

    async getThread({ threadId }: GetThreadParams): Promise<CommentThread | null> {
      return threadStore.find((thread) => thread.id === threadId) ?? null;
    },

    async listMessages({
      threadId,
    }: ListMessagesParams): Promise<CommentMessage[]> {
      const sorted = messageStore
        .filter((message) => message.threadId === threadId)
        .sort(sortByCreatedAtAsc);

      const duplicates = findDuplicateKeys(sorted, (message) => message.id);
      const unique = dedupeByKey(sorted, (message) => message.id);

      if (duplicates.length > 0) {
        feedbackDebugLog("threaded.listMessages duplicates", {
          threadId,
          count: duplicates.length,
          ids: duplicates,
        });
      }

      feedbackDebugLog("threaded.listMessages", {
        threadId,
        count: unique.length,
        ids: unique.map((m) => m.id),
      });

      return unique;
    },

    async addReply({ threadId, text }: AddReplyParams): Promise<CommentMessage> {
      const createdAt = new Date().toISOString();
      const id = `cmsg_${String(messageSequence).padStart(3, "0")}`;
      messageSequence += 1;

      const message: CommentMessage = {
        id,
        threadId,
        authorRole: "barangay_official",
        authorId: "official_001",
        text,
        createdAt,
      };

      messageStore = [...messageStore, message];

      threadStore = threadStore.map((thread) => {
        if (thread.id !== threadId) return thread;

        return {
          ...thread,
          preview: {
            ...thread.preview,
            text,
            updatedAt: createdAt,
            status: "responded",
          },
        };
      });

      return message;
    },

    async resolveThread(_params: ResolveThreadParams): Promise<void> {
      return;
    },
  };
}
