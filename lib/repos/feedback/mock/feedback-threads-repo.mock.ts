import type {
  CreateReplyInput,
  CreateRootInput,
  FeedbackTarget,
  FeedbackThreadRow,
} from "../db.types";
import type { FeedbackThreadsRepo } from "../repo";
import { COMMENT_MESSAGES_FIXTURE } from "@/mocks/fixtures/feedback/comment-messages.fixture";
import { COMMENT_THREADS_FIXTURE } from "@/mocks/fixtures/feedback/comment-threads.fixture";

type FeedbackStore = {
  rows: FeedbackThreadRow[];
  sequence: number;
};

function sortThreadRowByCreatedAtAsc(a: { created_at: string }, b: { created_at: string }) {
  return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function sortByCreatedAtAscThenId(a: { createdAt: string; id: string }, b: { createdAt: string; id: string }) {
  const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  if (diff !== 0) return diff;
  return a.id.localeCompare(b.id);
}

function buildSeedRows(): FeedbackThreadRow[] {
  const rows: FeedbackThreadRow[] = [];

  const threadsById = new Map(COMMENT_THREADS_FIXTURE.map((t) => [t.id, t]));
  assert(threadsById.size === COMMENT_THREADS_FIXTURE.length, "Expected unique thread ids in COMMENT_THREADS_FIXTURE");

  for (const message of COMMENT_MESSAGES_FIXTURE) {
    assert(
      threadsById.has(message.threadId),
      `Comment message references unknown threadId="${message.threadId}" (message id="${message.id}")`
    );
  }

  const messagesByThreadId = new Map<string, typeof COMMENT_MESSAGES_FIXTURE>();
  for (const thread of COMMENT_THREADS_FIXTURE) {
    const messages = COMMENT_MESSAGES_FIXTURE
      .filter((m) => m.threadId === thread.id)
      .slice()
      .sort(sortByCreatedAtAscThenId);

    assert(messages.length > 0, `Expected at least 1 message for threadId="${thread.id}"`);
    messagesByThreadId.set(thread.id, messages);
  }

  for (const thread of COMMENT_THREADS_FIXTURE) {
    const messages = messagesByThreadId.get(thread.id);
    assert(messages, `Expected message store for threadId="${thread.id}"`);

    const rootMessage = messages[0];

    const targetType: FeedbackThreadRow["target_type"] =
      thread.target.targetKind === "project" ? "project" : "aip";
    const aipId = thread.target.targetKind === "aip" ? thread.target.aipId : null;
    const projectId = thread.target.targetKind === "project" ? thread.target.projectId : null;
    const fieldKey =
      thread.target.targetKind === "aip" ? thread.target.fieldKey ?? null : null;

    if (targetType === "project") {
      assert(projectId, `Expected projectId for threadId="${thread.id}"`);

      rows.push({
        id: thread.id,
        target_type: "project",
        project_id: projectId,
        aip_id: null,
        field_key: null,
        parent_feedback_id: null,
        source: "human",
        kind: rootMessage.kind,
        extraction_run_id: null,
        extraction_artifact_id: null,
        severity: null,
        body: rootMessage.text,
        is_public: true,
        author_id: rootMessage.authorId,
        created_at: rootMessage.createdAt,
        updated_at: rootMessage.createdAt,
      });

      for (const message of messages.slice(1)) {
        rows.push({
          id: message.id,
          target_type: "project",
          project_id: projectId,
          aip_id: null,
          field_key: null,
          parent_feedback_id: thread.id,
          source: "human",
          kind: message.kind,
          extraction_run_id: null,
          extraction_artifact_id: null,
          severity: null,
          body: message.text,
          is_public: true,
          author_id: message.authorId,
          created_at: message.createdAt,
          updated_at: message.createdAt,
        });
      }
    } else {
      assert(aipId, `Expected aipId for threadId="${thread.id}"`);

      rows.push({
        id: thread.id,
        target_type: "aip",
        project_id: null,
        aip_id: aipId,
        field_key: fieldKey,
        parent_feedback_id: null,
        source: "human",
        kind: rootMessage.kind,
        extraction_run_id: null,
        extraction_artifact_id: null,
        severity: null,
        body: rootMessage.text,
        is_public: true,
        author_id: rootMessage.authorId,
        created_at: rootMessage.createdAt,
        updated_at: rootMessage.createdAt,
      });

      for (const message of messages.slice(1)) {
        rows.push({
          id: message.id,
          target_type: "aip",
          project_id: null,
          aip_id: aipId,
          field_key: fieldKey,
          parent_feedback_id: thread.id,
          source: "human",
          kind: message.kind,
          extraction_run_id: null,
          extraction_artifact_id: null,
          severity: null,
          body: message.text,
          is_public: true,
          author_id: message.authorId,
          created_at: message.createdAt,
          updated_at: message.createdAt,
        });
      }
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

function matchTarget(row: FeedbackThreadRow, target: FeedbackTarget) {
  if (target.target_type === "project") {
    const projectId = target.project_id ?? null;
    return row.target_type === "project" && (projectId === null || (row.project_id ?? null) === projectId);
  }

  const aipId = target.aip_id ?? null;
  const fieldKey = target.field_key ?? null;
  return (
    row.target_type === "aip"
    && (aipId === null || (row.aip_id ?? null) === aipId)
    && (fieldKey === null || (row.field_key ?? null) === fieldKey)
  );
}

export function createMockFeedbackThreadsRepo(): FeedbackThreadsRepo {
  const store = createStore();

  return {
    async listThreadRootsByTarget(target: FeedbackTarget): Promise<FeedbackThreadRow[]> {
      return store.rows
        .filter((row) => row.parent_feedback_id === null && matchTarget(row, target))
        .sort(sortThreadRowByCreatedAtAsc);
    },

    async listThreadMessages(rootId: string): Promise<FeedbackThreadRow[]> {
      return store.rows
        .filter((row) => row.id === rootId || row.parent_feedback_id === rootId)
        .sort(sortThreadRowByCreatedAtAsc);
    },

    async createRoot(input: CreateRootInput): Promise<FeedbackThreadRow> {
      const now = new Date().toISOString();
      const base = {
        id: nextId(store),
        parent_feedback_id: null,
        source: input.source ?? "human",
        kind: input.kind,
        extraction_run_id: input.extractionRunId ?? null,
        extraction_artifact_id: input.extractionArtifactId ?? null,
        severity: input.severity ?? null,
        body: input.body,
        is_public: input.isPublic ?? true,
        author_id: input.authorId,
        created_at: now,
        updated_at: now,
      };

      let row: FeedbackThreadRow;
      if (input.target.target_type === "project") {
        assert(input.target.project_id, "project_id is required for project feedback.");
        row = {
          ...base,
          target_type: "project",
          project_id: input.target.project_id,
          aip_id: null,
          field_key: null,
        };
      } else {
        assert(input.target.aip_id, "aip_id is required for AIP feedback.");
        row = {
          ...base,
          target_type: "aip",
          project_id: null,
          aip_id: input.target.aip_id,
          field_key: input.target.field_key ?? null,
        };
      }
      store.rows = [...store.rows, row];
      return row;
    },

    async createReply(input: CreateReplyInput): Promise<FeedbackThreadRow> {
      const parent = store.rows.find((row) => row.id === input.parentId) ?? null;
      if (!parent) {
        throw new Error("parent feedback not found");
      }

      if (input.target) {
        const matchesTarget =
          input.target.target_type === parent.target_type &&
          (input.target.aip_id ?? null) === (parent.aip_id ?? null) &&
          (input.target.project_id ?? null) === (parent.project_id ?? null) &&
          (input.target.field_key ?? null) === (parent.field_key ?? null);
        if (!matchesTarget) {
          throw new Error("reply feedback must match parent target");
        }
      }

      const now = new Date().toISOString();
      const base = {
        id: nextId(store),
        parent_feedback_id: parent.id,
        source: input.source ?? "human",
        kind: input.kind,
        extraction_run_id: null,
        extraction_artifact_id: null,
        severity: null,
        body: input.body,
        is_public: input.isPublic ?? true,
        author_id: input.authorId,
        created_at: now,
        updated_at: now,
      };

      let row: FeedbackThreadRow;
      if (parent.target_type === "project") {
        row = {
          ...base,
          target_type: "project",
          project_id: parent.project_id,
          aip_id: null,
          field_key: null,
        };
      } else {
        row = {
          ...base,
          target_type: "aip",
          project_id: null,
          aip_id: parent.aip_id,
          field_key: parent.field_key ?? null,
        };
      }

      store.rows = [...store.rows, row];
      return row;
    },
  };
}
