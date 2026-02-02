import { COMMENTS_MOCK } from "../mock";
import type { Comment } from "../types";
import type { FeedbackRow } from "./feedback.types";
import type {
  CreateReplyInput,
  CreateRootInput,
  FeedbackRepo,
  FeedbackTarget,
} from "./feedback.repo";

type FeedbackStore = {
  rows: FeedbackRow[];
  sequence: number;
};

function sortByCreatedAtAsc(a: { created_at: string }, b: { created_at: string }) {
  return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
}

function buildSeedRows(comments: Comment[]): FeedbackRow[] {
  const rows: FeedbackRow[] = [];

  for (const comment of comments) {
    rows.push({
      id: comment.id,
      target_type: "project",
      project_id: comment.project_id,
      aip_id: null,
      parent_feedback_id: null,
      body: comment.message,
      author_id: comment.commenter_name,
      created_at: comment.created_at,
    });

    if (comment.response?.message) {
      rows.push({
        id: `reply_${comment.id}`,
        target_type: "project",
        project_id: comment.project_id,
        aip_id: null,
        parent_feedback_id: comment.id,
        body: comment.response.message,
        author_id: comment.response.responder_name,
        created_at: comment.response.created_at,
      });
    }
  }

  return rows;
}

function createStore(): FeedbackStore {
  const rows = buildSeedRows(COMMENTS_MOCK);
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

export function getMockFeedbackMetadata() {
  return new Map(COMMENTS_MOCK.map((comment) => [comment.id, comment]));
}

export function createMockFeedbackRepo(): FeedbackRepo {
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
