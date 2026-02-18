import type {
  AddReplyParams,
  CommentRepo,
  CommentTargetLookup,
  CreateThreadParams,
  GetThreadParams,
  ListMessagesParams,
  ListThreadsForInboxParams,
  ResolveThreadParams,
} from "../repo";
import type { CommentMessage, CommentThread } from "../types";
import type { LguScopeKind } from "@/lib/auth/scope";
import { COMMENT_MESSAGES_FIXTURE } from "@/mocks/fixtures/feedback/comment-messages.fixture";
import { COMMENT_THREADS_FIXTURE } from "@/mocks/fixtures/feedback/comment-threads.fixture";
import { validateMockIds } from "@/mocks/fixtures/shared/validate-mock-ids";
import { feedbackDebugLog } from "../debug";
import { dedupeByKey, findDuplicateKeys } from "../mappers";
import { getProjectsRepo } from "@/lib/repos/projects/repo";
import { AIPS_TABLE } from "@/mocks/fixtures/aip/aips.table.fixture";
import { AIP_PROJECT_ROWS_TABLE } from "@/mocks/fixtures/aip/aip-project-rows.table.fixture";
import { MOCK_PROJECTS_ROWS } from "@/mocks/fixtures/projects/projects.mock.fixture";
import { AIP_IDS } from "@/mocks/fixtures/shared/id-contract.fixture";
import { canPublicReadAip } from "@/lib/repos/_shared/visibility";

let threadStore: CommentThread[] = [...COMMENT_THREADS_FIXTURE];
let messageStore: CommentMessage[] = [...COMMENT_MESSAGES_FIXTURE];
let threadSequence = threadStore.length + 1;
let messageSequence = messageStore.length + 1;
let mockIdsValidated = false;

function sortByUpdatedAtDesc(a: CommentThread, b: CommentThread) {
  return new Date(b.preview.updatedAt).getTime() - new Date(a.preview.updatedAt).getTime();
}

function sortByCreatedAtAsc(a: CommentMessage, b: CommentMessage) {
  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
}

type ThreadScopeRef = {
  scope: LguScopeKind;
  scopeId: string | null;
  cityId: string | null;
  municipalityId: string | null;
};

const MOCK_CITY_SCOPE_ID = "00000000-0000-0000-0000-000000000401";
const MOCK_BARANGAY_SCOPE_BY_AIP_ID: Record<string, string> = {
  [AIP_IDS.barangay_mamadid_2026]: "00000000-0000-0000-0000-000000000501",
  [AIP_IDS.barangay_poblacion_2026]: "00000000-0000-0000-0000-000000000502",
  [AIP_IDS.barangay_mamadid_2025]: "00000000-0000-0000-0000-000000000501",
  [AIP_IDS.barangay_santamaria_2026]: "00000000-0000-0000-0000-000000000504",
  [AIP_IDS.barangay_sanisidro_2026]: "00000000-0000-0000-0000-000000000503",
};
const KNOWN_SCOPE_IDS = new Set<string>([
  MOCK_CITY_SCOPE_ID,
  ...Object.values(MOCK_BARANGAY_SCOPE_BY_AIP_ID),
]);

function getAipScopeRefById(aipId: string): ThreadScopeRef | null {
  const aip = AIPS_TABLE.find((item) => item.id === aipId);
  if (!aip) return null;
  if (aip.scope === "city") {
    return {
      scope: "city",
      scopeId: MOCK_CITY_SCOPE_ID,
      cityId: MOCK_CITY_SCOPE_ID,
      municipalityId: null,
    };
  }
  return {
    scope: "barangay",
    scopeId: MOCK_BARANGAY_SCOPE_BY_AIP_ID[aip.id] ?? null,
    cityId: MOCK_CITY_SCOPE_ID,
    municipalityId: null,
  };
}

function getAipStatusById(aipId: string): string | null {
  const aip = AIPS_TABLE.find((item) => item.id === aipId);
  return aip?.status ?? null;
}

function getThreadAipId(thread: CommentThread): string | null {
  if (thread.target.targetKind !== "project") {
    return thread.target.aipId;
  }

  const projectId = thread.target.projectId;
  const projectRow = MOCK_PROJECTS_ROWS.find((row) => row.id === projectId);
  if (projectRow?.aip_id) {
    return projectRow.aip_id;
  }

  const aipItem = AIP_PROJECT_ROWS_TABLE.find((row) => row.projectRefCode === projectId);
  if (aipItem) {
    return aipItem.aipId;
  }

  return null;
}

function isThreadPubliclyVisible(thread: CommentThread): boolean {
  const aipId = getThreadAipId(thread);
  if (!aipId) return false;
  return canPublicReadAip({ status: getAipStatusById(aipId) });
}

function getThreadScopeRef(thread: CommentThread): ThreadScopeRef | null {
  if (thread.target.targetKind !== "project") {
    return getAipScopeRefById(thread.target.aipId);
  }

  const projectId = thread.target.projectId;
  const projectRow = MOCK_PROJECTS_ROWS.find((row) => row.id === projectId);
  if (projectRow?.aip_id) {
    return getAipScopeRefById(projectRow.aip_id);
  }

  const aipItem = AIP_PROJECT_ROWS_TABLE.find((row) => row.projectRefCode === projectId);
  if (aipItem) {
    return getAipScopeRefById(aipItem.aipId);
  }

  return null;
}

function matchesScopeId(
  lguId: string | null | undefined,
  requestedScope: LguScopeKind,
  scopeRef: ThreadScopeRef | null
): boolean {
  if (!lguId) return true;
  if (!scopeRef) return false;
  if (!KNOWN_SCOPE_IDS.has(lguId)) return true;
  if (requestedScope === "city") return scopeRef.cityId === lguId;
  if (requestedScope === "barangay") return scopeRef.scope === "barangay" && scopeRef.scopeId === lguId;
  return scopeRef.municipalityId === lguId;
}

function canAccessThreadScope(requestedScope: LguScopeKind, threadScope: LguScopeKind): boolean {
  if (requestedScope === "city") {
    return threadScope === "city" || threadScope === "barangay";
  }
  if (requestedScope === "barangay") {
    return threadScope === "barangay";
  }
  if (requestedScope === "municipality") {
    return threadScope === "municipality";
  }
  return false;
}

export function createMockCommentRepo(): CommentRepo {
  if (!mockIdsValidated && process.env.NODE_ENV !== "production") {
    validateMockIds();
    mockIdsValidated = true;
  }

  return {
    async listThreadsForInbox(params: ListThreadsForInboxParams): Promise<CommentThread[]> {
      const filteredByScope = threadStore.filter((thread) => {
        const scopeRef = getThreadScopeRef(thread);
        const threadScope = scopeRef?.scope ?? "barangay";
        if (!canAccessThreadScope(params.scope, threadScope)) return false;
        if (!matchesScopeId(params.lguId, params.scope, scopeRef)) return false;
        if (params.visibility === "public" && !isThreadPubliclyVisible(thread)) return false;
        return true;
      });

      const sorted = [...filteredByScope].sort(sortByUpdatedAtDesc);
      const duplicates = findDuplicateKeys(sorted, (thread) => thread.id);
      const unique = dedupeByKey(sorted, (thread) => thread.id);

      if (duplicates.length > 0) {
        feedbackDebugLog("threaded.listThreadsForInbox duplicates", {
          count: duplicates.length,
          ids: duplicates,
        });
      }

      feedbackDebugLog("threaded.listThreadsForInbox", {
        scope: params.scope,
        lguId: params.lguId ?? null,
        visibility: params.visibility ?? "authenticated",
        count: unique.length,
        ids: unique.map((t) => t.id),
      });

      return unique;
    },

    async getThread({ threadId }: GetThreadParams): Promise<CommentThread | null> {
      return threadStore.find((thread) => thread.id === threadId) ?? null;
    },

    async listMessages({ threadId }: ListMessagesParams): Promise<CommentMessage[]> {
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

    async createThread({
      target,
      text,
      kind,
      authorId,
      authorRole,
      authorName,
      authorScopeLabel,
    }: CreateThreadParams): Promise<CommentThread> {
      const createdAt = new Date().toISOString();
      const threadId = `thread_${String(threadSequence).padStart(3, "0")}`;
      threadSequence += 1;

      const messageId = `cmsg_${String(messageSequence).padStart(3, "0")}`;
      messageSequence += 1;

      const message: CommentMessage = {
        id: messageId,
        threadId,
        authorRole,
        authorId,
        kind,
        text,
        createdAt,
      };

      const thread: CommentThread = {
        id: threadId,
        createdAt,
        createdByUserId: authorId,
        target,
        preview: {
          text,
          updatedAt: createdAt,
          status: "no_response",
          kind,
          authorName,
          authorScopeLabel,
        },
      };

      messageStore = [...messageStore, message];
      threadStore = [...threadStore, thread];

      return thread;
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
        kind: "lgu_note",
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

export function createMockCommentTargetLookup(): CommentTargetLookup {
  return {
    async getProject(id) {
      const repo = getProjectsRepo();
      const project = await repo.getByRefCode(id);
      if (!project) return null;
      return {
        id: project.id,
        title: project.title,
        year: project.year,
        kind: project.kind,
      };
    },

    async getAip(id) {
      const aip = AIPS_TABLE.find((item) => item.id === id);
      if (!aip) return null;
      return {
        id: aip.id,
        title: aip.title,
        year: aip.year,
        barangayName: aip.barangayName ?? null,
      };
    },

    async getAipItem(aipId, aipItemId) {
      const item = AIP_PROJECT_ROWS_TABLE.find((row) => row.aipId === aipId && row.id === aipItemId);
      if (!item) return null;
      return {
        id: item.id,
        aipId: item.aipId,
        projectRefCode: item.projectRefCode,
        aipDescription: item.aipDescription,
      };
    },

    async findAipItemByProjectRefCode(projectRefCode) {
      const item = AIP_PROJECT_ROWS_TABLE.find((row) => row.projectRefCode === projectRefCode);
      if (!item) return null;
      return {
        id: item.id,
        aipId: item.aipId,
        projectRefCode: item.projectRefCode,
        aipDescription: item.aipDescription,
      };
    },
  };
}
