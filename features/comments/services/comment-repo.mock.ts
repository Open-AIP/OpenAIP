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

let threadStore: CommentThread[] = [...COMMENT_THREADS_MOCK];
let messageStore: CommentMessage[] = [...COMMENT_MESSAGES_MOCK];
let messageSequence = messageStore.length + 1;

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
  return {
    async listThreadsForInbox(
      _params: ListThreadsForInboxParams
    ): Promise<CommentThread[]> {
      return [...threadStore].sort(sortByUpdatedAtDesc);
    },

    async getThread({ threadId }: GetThreadParams): Promise<CommentThread | null> {
      return threadStore.find((thread) => thread.id === threadId) ?? null;
    },

    async listMessages({
      threadId,
    }: ListMessagesParams): Promise<CommentMessage[]> {
      return messageStore
        .filter((message) => message.threadId === threadId)
        .sort(sortByCreatedAtAsc);
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
