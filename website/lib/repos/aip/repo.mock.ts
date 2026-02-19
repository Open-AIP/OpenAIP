import type { AipProjectRepo, AipRepo, AipStatus, LguScope } from "./repo";
import type {
  AipProjectFeedbackMessage,
  AipProjectFeedbackThread,
  AipProjectReviewDetail,
  AipProjectRow,
  CreateMockAipRepoOptions,
  ProjectCategory,
  SubmitReviewInput,
} from "./types";
import {
  applyProjectEditPatch,
  buildProjectReviewBody,
  deriveSectorFromRefCode,
  diffProjectEditableFields,
  normalizeProjectEditPatch,
  normalizeProjectErrors,
  projectEditableFieldsFromRow,
} from "./project-review";
import { AIPS_TABLE } from "@/mocks/fixtures/aip/aips.table.fixture";
import { AIP_PROJECT_ROWS_TABLE } from "@/mocks/fixtures/aip/aip-project-rows.table.fixture";
import { generateMockAIP, generateMockProjects } from "./mock-aip-generator";

type LegacyAipProjectRow = (typeof AIP_PROJECT_ROWS_TABLE)[number];
type ProjectStore = Map<string, AipProjectRow>;
type ProjectFeedbackStore = Map<string, AipProjectFeedbackMessage[]>;

const mockProjectStore: ProjectStore = new Map();
const mockProjectFeedbackStore: ProjectFeedbackStore = new Map();
let storeSeeded = false;
let feedbackSeeded = false;
let feedbackSequence = 1;

const REVIEWABLE_AIP_STATUSES = new Set<AipStatus>(["draft", "for_revision"]);

function cloneRow(row: AipProjectRow): AipProjectRow {
  return {
    ...row,
    errors: row.errors ? [...row.errors] : null,
    aiIssues: row.aiIssues ? [...row.aiIssues] : undefined,
  };
}

function cloneFeedbackMessage(message: AipProjectFeedbackMessage): AipProjectFeedbackMessage {
  return { ...message };
}

function nextFeedbackId(): string {
  const id = `aip_fbk_${String(feedbackSequence).padStart(4, "0")}`;
  feedbackSequence += 1;
  return id;
}

function normalizeCategory(value: unknown): ProjectCategory {
  if (value === "health" || value === "infrastructure" || value === "other") {
    return value;
  }
  return "other";
}

function buildCanonicalRow(
  base: LegacyAipProjectRow | AipProjectRow,
  fallbackSector?: AipProjectRow["sector"]
): AipProjectRow {
  if ("aipRefCode" in base && "programProjectDescription" in base) {
    const errors = normalizeProjectErrors(base.errors);
    const sectorFromRef = deriveSectorFromRefCode(base.aipRefCode);
    const sector =
      sectorFromRef === "Unknown"
        ? (base.sector ?? fallbackSector ?? "Unknown")
        : sectorFromRef;

    return {
      ...base,
      category: normalizeCategory(base.category),
      kind: normalizeCategory(base.category),
      total: base.total,
      errors,
      aiIssues: errors ?? undefined,
      projectRefCode: base.aipRefCode,
      aipDescription: base.programProjectDescription,
      sector,
      amount: base.total ?? 0,
    };
  }

  const category = normalizeCategory(base.kind);
  const errors = normalizeProjectErrors(base.aiIssues);
  const sectorFromRef = deriveSectorFromRefCode(base.projectRefCode);
  const sector =
    sectorFromRef === "Unknown"
      ? (base.sector ?? fallbackSector ?? "Unknown")
      : sectorFromRef;

  return {
    id: base.id,
    aipId: base.aipId,

    aipRefCode: base.projectRefCode,
    programProjectDescription: base.aipDescription,
    implementingAgency: null,
    startDate: null,
    completionDate: null,
    expectedOutput: null,
    sourceOfFunds: null,
    personalServices: null,
    maintenanceAndOtherOperatingExpenses: null,
    financialExpenses: null,
    capitalOutlay: null,
    total: base.amount ?? null,
    climateChangeAdaptation: null,
    climateChangeMitigation: null,
    ccTopologyCode: null,
    category,
    errors,

    // Compatibility aliases
    projectRefCode: base.projectRefCode,
    kind: category,
    sector,
    amount: base.amount ?? 0,
    reviewStatus: base.reviewStatus,
    aipDescription: base.aipDescription,
    aiIssues: errors ?? undefined,
    officialComment: base.officialComment,
  };
}

function seedStoreIfNeeded() {
  if (storeSeeded) return;
  storeSeeded = true;

  for (const row of AIP_PROJECT_ROWS_TABLE) {
    const canonical = buildCanonicalRow(row);
    mockProjectStore.set(canonical.id, canonical);
  }
}

function seedFeedbackStoreIfNeeded() {
  seedStoreIfNeeded();
  if (feedbackSeeded) return;
  feedbackSeeded = true;

  for (const row of mockProjectStore.values()) {
    const body = row.officialComment?.trim();
    if (!body) continue;

    const createdAt = new Date(Date.UTC(2026, 0, 1, 0, 0, feedbackSequence)).toISOString();
    const seedMessage: AipProjectFeedbackMessage = {
      id: nextFeedbackId(),
      parentFeedbackId: null,
      kind: "lgu_note",
      source: "human",
      body,
      authorId: "official_001",
      authorName: "Barangay Official",
      createdAt,
      updatedAt: createdAt,
    };

    const existing = mockProjectFeedbackStore.get(row.id) ?? [];
    mockProjectFeedbackStore.set(row.id, [...existing, seedMessage]);
  }
}

function sortFeedbackMessageByCreatedAtAsc(
  left: AipProjectFeedbackMessage,
  right: AipProjectFeedbackMessage
): number {
  const leftAt = new Date(left.createdAt).getTime();
  const rightAt = new Date(right.createdAt).getTime();
  if (leftAt !== rightAt) return leftAt - rightAt;
  return left.id.localeCompare(right.id);
}

function sortFeedbackThreadByRootCreatedAtDesc(
  left: AipProjectFeedbackThread,
  right: AipProjectFeedbackThread
): number {
  const leftAt = new Date(left.root.createdAt).getTime();
  const rightAt = new Date(right.root.createdAt).getTime();
  if (leftAt !== rightAt) return rightAt - leftAt;
  return right.root.id.localeCompare(left.root.id);
}

function listProjectFeedbackMessages(projectId: string): AipProjectFeedbackMessage[] {
  seedFeedbackStoreIfNeeded();
  return (mockProjectFeedbackStore.get(projectId) ?? [])
    .map(cloneFeedbackMessage)
    .sort(sortFeedbackMessageByCreatedAtAsc);
}

function appendProjectFeedbackMessage(
  projectId: string,
  message: AipProjectFeedbackMessage
) {
  seedFeedbackStoreIfNeeded();
  const current = mockProjectFeedbackStore.get(projectId) ?? [];
  mockProjectFeedbackStore.set(projectId, [...current, message]);
}

function resolveRootMessageId(
  messageId: string,
  messagesById: Map<string, AipProjectFeedbackMessage>
): string {
  const origin = messagesById.get(messageId);
  if (!origin) return messageId;

  const visited = new Set<string>();
  let current = origin;
  while (current.parentFeedbackId) {
    const parentId = current.parentFeedbackId;
    if (visited.has(parentId)) break;
    visited.add(parentId);

    const parent = messagesById.get(parentId);
    if (!parent) break;
    current = parent;
  }
  return current.id;
}

function buildProjectFeedbackThreads(
  messages: AipProjectFeedbackMessage[]
): AipProjectFeedbackThread[] {
  if (!messages.length) return [];

  const ordered = [...messages].sort(sortFeedbackMessageByCreatedAtAsc);
  const messagesById = new Map(ordered.map((message) => [message.id, message]));
  const threadsByRootId = new Map<string, AipProjectFeedbackThread>();

  for (const message of ordered) {
    const rootId = resolveRootMessageId(message.id, messagesById);
    const root = messagesById.get(rootId) ?? message;
    const thread = threadsByRootId.get(rootId) ?? { root, replies: [] };
    if (message.id !== thread.root.id) {
      thread.replies.push(message);
    }
    threadsByRootId.set(rootId, thread);
  }

  return Array.from(threadsByRootId.values())
    .map((thread) => ({
      root: cloneFeedbackMessage(thread.root),
      replies: thread.replies.map(cloneFeedbackMessage).sort(sortFeedbackMessageByCreatedAtAsc),
    }))
    .sort(sortFeedbackThreadByRootCreatedAtDesc);
}

function latestLguNote(messages: AipProjectFeedbackMessage[]): string | undefined {
  const latest = [...messages]
    .filter((message) => message.kind === "lgu_note")
    .sort((left, right) => {
      const leftAt = new Date(left.createdAt).getTime();
      const rightAt = new Date(right.createdAt).getTime();
      if (leftAt !== rightAt) return rightAt - leftAt;
      return right.id.localeCompare(left.id);
    })[0];

  return latest?.body;
}

function assertProjectReviewIsEditable(aipId: string) {
  const aip = AIPS_TABLE.find((item) => item.id === aipId);
  if (!aip) {
    if (aipId.startsWith("aip-")) return;
    throw new Error("AIP not found.");
  }
  if (!REVIEWABLE_AIP_STATUSES.has(aip.status)) {
    throw new Error(
      "Project reviews can only be submitted when the AIP status is Draft or For Revision."
    );
  }
}

function upsertStoreRows(rows: Array<LegacyAipProjectRow | AipProjectRow>) {
  for (const row of rows) {
    const existing = mockProjectStore.get(row.id);
    const canonical = buildCanonicalRow(
      row,
      existing?.sector
    );
    mockProjectStore.set(canonical.id, canonical);
  }
}

function listStoreRowsByAip(aipId: string): AipProjectRow[] {
  return Array.from(mockProjectStore.values())
    .filter((row) => row.aipId === aipId)
    .sort((a, b) => a.projectRefCode.localeCompare(b.projectRefCode))
    .map(cloneRow);
}

function applyEditsToStoredRow(
  row: AipProjectRow,
  fields: ReturnType<typeof projectEditableFieldsFromRow>
): AipProjectRow {
  const normalizedErrors = normalizeProjectErrors(fields.errors);
  const derivedSector = deriveSectorFromRefCode(fields.aipRefCode);
  const nextSector = derivedSector === "Unknown" ? row.sector : derivedSector;
  const nextCategory = normalizeCategory(fields.category);

  return {
    ...row,
    ...fields,
    category: nextCategory,
    kind: nextCategory,
    projectRefCode: fields.aipRefCode,
    aipDescription: fields.programProjectDescription,
    total: fields.total,
    amount: fields.total ?? 0,
    errors: normalizedErrors,
    aiIssues: normalizedErrors ?? undefined,
    sector: nextSector,
  };
}

function submitMockReview(
  row: AipProjectRow,
  input: SubmitReviewInput
): { updatedRow: AipProjectRow; commentBody: string } {
  const reason = input.reason.trim();
  if (!reason) {
    throw new Error("Review comment is required.");
  }

  const baseFields = projectEditableFieldsFromRow(row);
  const normalizedPatch = normalizeProjectEditPatch(input.changes, baseFields);
  const nextFields = applyProjectEditPatch(baseFields, normalizedPatch);
  const diff = diffProjectEditableFields(baseFields, nextFields);
  const hasAiIssues = (row.errors?.length ?? 0) > 0;

  if (!hasAiIssues && diff.length === 0) {
    throw new Error("No changes detected. Edit at least one field before saving.");
  }

  const body = buildProjectReviewBody({
    reason,
    diff,
  });

  const withEdits = diff.length > 0 ? applyEditsToStoredRow(row, nextFields) : row;
  return {
    updatedRow: {
      ...withEdits,
      officialComment: body,
      reviewStatus: "reviewed",
    },
    commentBody: body,
  };
}

export function createMockAipRepoImpl({
  defaultScope = "barangay",
}: CreateMockAipRepoOptions = {}): AipRepo {
  return {
    async listVisibleAips(
      { visibility = "my", scope }: { visibility?: "public" | "my"; scope?: LguScope } = {},
      _actor?: import("@/lib/domain/actor-context").ActorContext
    ) {
      const effectiveScope = scope ?? defaultScope;
      const filtered = AIPS_TABLE.filter((aip) => aip.scope === effectiveScope);
      if (visibility === "public") {
        return filtered.filter((aip) => aip.status !== "draft");
      }
      return filtered;
    },
    async getAipDetail(
      aipId: string,
      _actor?: import("@/lib/domain/actor-context").ActorContext
    ) {
      if (!aipId) return null;

      const found = AIPS_TABLE.find((aip) => aip.id === aipId);
      if (found) return found;

      if (aipId.startsWith("aip-")) {
        const yearMatch = aipId.match(/aip-(\d{4})/);
        const year = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear();
        const fileName = `${aipId.split("-").slice(2, -1).join("-")}.pdf`;
        return generateMockAIP(aipId, fileName, year, defaultScope);
      }

      return null;
    },
    async updateAipStatus(
      aipId: string,
      next: AipStatus,
      _actor?: import("@/lib/domain/actor-context").ActorContext
    ) {
      const index = AIPS_TABLE.findIndex((aip) => aip.id === aipId);
      if (index === -1) return;
      AIPS_TABLE[index] = { ...AIPS_TABLE[index], status: next };
    },
  };
}

export function createMockAipRepo(options: CreateMockAipRepoOptions = {}): AipRepo {
  return createMockAipRepoImpl(options);
}

export function createMockAipProjectRepo(): AipProjectRepo {
  return {
    async listByAip(aipId: string) {
      seedStoreIfNeeded();

      const existingProjects = listStoreRowsByAip(aipId);
      if (existingProjects.length) {
        return existingProjects;
      }

      if (aipId.startsWith("aip-")) {
        const yearMatch = aipId.match(/aip-(\d{4})/);
        const year = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear();
        const generated = generateMockProjects(aipId, year, 6);
        upsertStoreRows(generated);
        return listStoreRowsByAip(aipId);
      }

      return [];
    },
    async getReviewDetail(aipId: string, projectId: string): Promise<AipProjectReviewDetail | null> {
      seedStoreIfNeeded();
      seedFeedbackStoreIfNeeded();

      const row = mockProjectStore.get(projectId);
      if (!row || row.aipId !== aipId) return null;

      const messages = listProjectFeedbackMessages(projectId);
      const note = latestLguNote(messages);
      const project = cloneRow(
        note
          ? {
              ...row,
              officialComment: note,
              reviewStatus: "reviewed",
            }
          : row
      );

      return {
        project,
        feedbackThreads: buildProjectFeedbackThreads(messages),
      };
    },
    async submitReview(input: SubmitReviewInput) {
      seedStoreIfNeeded();
      seedFeedbackStoreIfNeeded();
      assertProjectReviewIsEditable(input.aipId);

      const current = mockProjectStore.get(input.projectId);
      if (!current || current.aipId !== input.aipId) {
        throw new Error("Project not found.");
      }

      const { updatedRow, commentBody } = submitMockReview(current, input);
      mockProjectStore.set(updatedRow.id, updatedRow);

      const now = new Date().toISOString();
      appendProjectFeedbackMessage(input.projectId, {
        id: nextFeedbackId(),
        parentFeedbackId: null,
        kind: "lgu_note",
        source: "human",
        body: commentBody,
        authorId: "official_001",
        authorName: "Barangay Official",
        createdAt: now,
        updatedAt: now,
      });

      return cloneRow(updatedRow);
    },
  };
}
