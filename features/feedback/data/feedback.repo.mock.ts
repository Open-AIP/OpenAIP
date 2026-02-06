import { COMMENT_MESSAGES_MOCK, COMMENT_THREADS_MOCK } from "../mock";
import type { FeedbackRow } from "./feedback.types";
import type {
  CreateReplyInput,
  CreateRootInput,
  FeedbackThreadsRepo,
  FeedbackTarget,
} from "./feedback.repo";

type FeedbackStore = {
  rows: FeedbackRow[];
  sequence: number;
};

function sortByCreatedAtAsc(a: { created_at: string }, b: { created_at: string }) {
  return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function sortByCreatedAtAscThenId(
  a: { createdAt: string; id: string },
  b: { createdAt: string; id: string }
) {
  const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  if (diff !== 0) return diff;
  return a.id.localeCompare(b.id);
}

function buildSeedRows(): FeedbackRow[] {
  const rows: FeedbackRow[] = [];

  const threadsById = new Map(COMMENT_THREADS_MOCK.map((t) => [t.id, t]));
  assert(threadsById.size === COMMENT_THREADS_MOCK.length, "Expected unique thread ids in COMMENT_THREADS_MOCK");

  for (const message of COMMENT_MESSAGES_MOCK) {
    assert(
      threadsById.has(message.threadId),
      `Comment message references unknown threadId="${message.threadId}" (message id="${message.id}")`
    );
  }

  const messagesByThreadId = new Map<string, typeof COMMENT_MESSAGES_MOCK>();
  for (const thread of COMMENT_THREADS_MOCK) {
    const messages = COMMENT_MESSAGES_MOCK
      .filter((m) => m.threadId === thread.id)
      .slice()
      .sort(sortByCreatedAtAscThenId);

    assert(messages.length > 0, `Expected at least 1 message for threadId="${thread.id}"`);
    messagesByThreadId.set(thread.id, messages);
  }

  for (const thread of COMMENT_THREADS_MOCK) {
    const messages = messagesByThreadId.get(thread.id);
    assert(messages, `Expected message store for threadId="${thread.id}"`);

    const rootMessage = messages[0];

    const targetType: FeedbackRow["target_type"] =
      thread.target.targetKind === "project" ? "project" : "aip";
    const aipId =
      thread.target.targetKind === "aip_item" ? thread.target.aipId : null;
    const projectId =
      thread.target.targetKind === "project" ? thread.target.projectId : null;

    rows.push({
      id: thread.id,
      target_type: targetType,
      project_id: projectId,
      aip_id: aipId,
      parent_feedback_id: null,
      body: rootMessage.text,
      author_id: rootMessage.authorId,
      created_at: rootMessage.createdAt,
    });

    for (const message of messages.slice(1)) {
      rows.push({
        id: message.id,
        target_type: targetType,
        project_id: projectId,
        aip_id: aipId,
        parent_feedback_id: thread.id,
        body: message.text,
        author_id: message.authorId,
        created_at: message.createdAt,
      });
    }
  }

  return rows;
}

function createStore(): FeedbackStore {
  const rows = buildSeedRows();
  return { rows, sequence: rows.length + 1 };
}

function nextId(store: FeedbackStore) {
  const id = `fdbk_${String(store.sequence).padStart(3, "0")}`;
  store.sequence += 1;
  return id;
}

function matchTarget(row: FeedbackRow, target: FeedbackTarget) {
  if (target.target_type === "project") {
    const projectId = target.project_id ?? null;
    return (
      row.target_type === "project" &&
      (projectId === null || (row.project_id ?? null) === projectId)
    );
  }

  const aipId = target.aip_id ?? null;
  return (
    row.target_type === "aip" &&
    (aipId === null || (row.aip_id ?? null) === aipId)
  );
}

// [DATAFLOW] Mock implementation of `FeedbackThreadsRepo` that produces DBV2-shaped rows (root + replies).
// [DBV2] This mirrors `public.feedback` with `parent_feedback_id` and target columns; Supabase adapter should keep the same invariants.
export function createMockFeedbackThreadsRepo(): FeedbackThreadsRepo {
  const store = createStore();

  return {
    async listThreadRootsByTarget(target: FeedbackTarget): Promise<FeedbackRow[]> {
      return store.rows
        .filter((row) => row.parent_feedback_id === null && matchTarget(row, target))
        .sort(sortByCreatedAtAsc);
    },

    async listThreadMessages(rootId: string): Promise<FeedbackRow[]> {
      return store.rows
        .filter((row) => row.id === rootId || row.parent_feedback_id === rootId)
        .sort(sortByCreatedAtAsc);
    },

    async createRoot(input: CreateRootInput): Promise<FeedbackRow> {
      const now = new Date().toISOString();
      const row: FeedbackRow = {
        id: nextId(store),
        target_type: input.target.target_type,
        aip_id: input.target.aip_id ?? null,
        project_id: input.target.project_id ?? null,
        parent_feedback_id: null,
        body: input.body,
        author_id: input.authorId,
        created_at: now,
      };
      store.rows = [...store.rows, row];
      return row;
    },

    async createReply(input: CreateReplyInput): Promise<FeedbackRow> {
      const parent = store.rows.find((row) => row.id === input.parentId) ?? null;
      if (!parent) {
        throw new Error("parent feedback not found");
      }

      if (input.target) {
        const matchesTarget =
          input.target.target_type === parent.target_type &&
          (input.target.aip_id ?? null) === (parent.aip_id ?? null) &&
          (input.target.project_id ?? null) === (parent.project_id ?? null);
        if (!matchesTarget) {
          throw new Error("reply feedback must match parent target");
        }
      }

      const now = new Date().toISOString();
      const row: FeedbackRow = {
        id: nextId(store),
        target_type: parent.target_type,
        aip_id: parent.aip_id ?? null,
        project_id: parent.project_id ?? null,
        parent_feedback_id: parent.id,
        body: input.body,
        author_id: input.authorId,
        created_at: now,
      };

      store.rows = [...store.rows, row];
      return row;
    },
  };
}
