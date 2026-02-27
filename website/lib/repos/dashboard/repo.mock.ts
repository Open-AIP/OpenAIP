import { BARANGAY_DASHBOARD_MOCK, CITY_DASHBOARD_MOCK } from "@/mock/dashboard/dashboard-mock-payload";
import { applyAipUploaderMetadata, resolveDefaultFiscalYear, resolveSelectedFiscalYear } from "./mappers";
import type { DashboardRepo } from "./repo";
import {
  CITIZEN_FEEDBACK_KINDS,
  DASHBOARD_REPLY_MAX_LENGTH,
  type CreateDashboardDraftResult,
  type DashboardAip,
  type DashboardData,
  type DashboardFeedback,
} from "./types";

type DashboardState = {
  barangay: DashboardData;
  city: DashboardData;
};

type ScopeData = DashboardData;

const CITIZEN_KIND_SET = new Set<string>(CITIZEN_FEEDBACK_KINDS);

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function createInitialState(): DashboardState {
  return {
    barangay: deepClone(BARANGAY_DASHBOARD_MOCK),
    city: deepClone(CITY_DASHBOARD_MOCK),
  };
}

const STATE = createInitialState();
let draftCounter = 1;
let feedbackCounter = 1;

function selectScopeData(scope: "barangay" | "city"): ScopeData {
  return scope === "city" ? STATE.city : STATE.barangay;
}

function sortAips(rows: DashboardAip[]): DashboardAip[] {
  return [...rows].sort((left, right) => {
    if (left.fiscalYear !== right.fiscalYear) return right.fiscalYear - left.fiscalYear;
    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  });
}

function buildScopedDashboardData(input: {
  source: ScopeData;
  scope: "barangay" | "city";
  scopeId: string;
  requestedFiscalYear?: number | null;
}): DashboardData {
  const allAips = sortAips(input.source.allAips);
  const availableFiscalYears = Array.from(
    new Set(allAips.map((aip) => aip.fiscalYear))
  ).sort((left, right) => right - left);
  const fallbackFiscalYear = resolveDefaultFiscalYear(allAips);
  const selectedFiscalYear = resolveSelectedFiscalYear({
    requestedFiscalYear: input.requestedFiscalYear,
    availableFiscalYears,
    fallbackFiscalYear,
  });
  const selectedAip = allAips.find((aip) => aip.fiscalYear === selectedFiscalYear) ?? null;

  if (!selectedAip) {
    return {
      scope: input.scope,
      scopeId: input.scopeId,
      selectedFiscalYear,
      selectedAip: null,
      availableFiscalYears,
      allAips: applyAipUploaderMetadata(allAips, new Map()),
      projects: [],
      sectors: [...input.source.sectors],
      latestRuns: [],
      reviews: [],
      feedback: [],
    };
  }

  const projects = input.source.projects.filter((project) => project.aipId === selectedAip.id);
  const projectIdSet = new Set(projects.map((project) => project.id));
  const feedback = input.source.feedback.filter((item) => {
    if (item.targetType === "aip") return item.aipId === selectedAip.id;
    if (item.targetType === "project") return !!item.projectId && projectIdSet.has(item.projectId);
    return false;
  });

  return {
    scope: input.scope,
    scopeId: input.scopeId,
    selectedFiscalYear,
    selectedAip,
    availableFiscalYears,
    allAips: allAips.map((aip) => ({ ...aip })),
    projects: projects.map((project) => ({ ...project })),
    sectors: [...input.source.sectors],
    latestRuns: input.source.latestRuns.filter((run) => run.aipId === selectedAip.id),
    reviews: input.source.reviews.filter((review) => review.aipId === selectedAip.id),
    feedback: feedback.map((item) => ({ ...item })),
  };
}

function assertCitizenRootFeedback(parent: DashboardFeedback) {
  if (parent.parentFeedbackId) {
    throw new Error("Replies can only be posted to root citizen feedback.");
  }
  if (!CITIZEN_KIND_SET.has(parent.kind)) {
    throw new Error("Replies are only allowed for citizen feedback kinds.");
  }
}

function resolveParentAipIdForReply(input: {
  source: ScopeData;
  parent: DashboardFeedback;
}): string {
  if (input.parent.targetType === "aip") {
    if (!input.parent.aipId) throw new Error("Feedback parent is missing its AIP target.");
    return input.parent.aipId;
  }

  if (!input.parent.projectId) {
    throw new Error("Feedback parent is missing its project target.");
  }

  const project = input.source.projects.find((row) => row.id === input.parent.projectId);
  if (!project) throw new Error("Feedback parent project not found.");
  return project.aipId;
}

function createMockDraftAip(input: {
  scope: "barangay" | "city";
  fiscalYear: number;
}): DashboardAip {
  const now = new Date().toISOString();
  const nextId = `${input.scope}-draft-${input.fiscalYear}-${draftCounter++}`;

  return {
    id: nextId,
    fiscalYear: input.fiscalYear,
    status: "draft",
    statusUpdatedAt: now,
    submittedAt: null,
    publishedAt: null,
    createdAt: now,
    uploadedBy: null,
    uploadedDate: null,
  };
}

export function createMockDashboardRepo(): DashboardRepo {
  return {
    async getDashboardDataByScope(input) {
      const source = selectScopeData(input.scope);
      return buildScopedDashboardData({
        source,
        scope: input.scope,
        scopeId: input.scopeId,
        requestedFiscalYear: input.requestedFiscalYear,
      });
    },

    async createDraftAip(input): Promise<CreateDashboardDraftResult> {
      if (!Number.isInteger(input.fiscalYear) || input.fiscalYear < 2000 || input.fiscalYear > 2100) {
        throw new Error("Invalid fiscal year.");
      }

      const source = selectScopeData(input.scope);
      const existing = source.allAips.find((aip) => aip.fiscalYear === input.fiscalYear);
      if (existing) {
        return { created: false, aipId: existing.id };
      }

      const created = createMockDraftAip({
        scope: input.scope,
        fiscalYear: input.fiscalYear,
      });
      source.allAips = sortAips([created, ...source.allAips]);
      return { created: true, aipId: created.id };
    },

    async replyToFeedback(input) {
      const body = input.body.trim();
      if (!body) throw new Error("Reply body is required.");
      if (body.length > DASHBOARD_REPLY_MAX_LENGTH) {
        throw new Error(`Reply body must be at most ${DASHBOARD_REPLY_MAX_LENGTH} characters.`);
      }

      const source = selectScopeData(input.scope);
      const parent = source.feedback.find((item) => item.id === input.parentFeedbackId);
      if (!parent) throw new Error("Feedback parent not found.");
      assertCitizenRootFeedback(parent);
      resolveParentAipIdForReply({ source, parent });

      const now = new Date().toISOString();
      const nextId = `mock-feedback-reply-${feedbackCounter++}`;
      source.feedback.push({
        id: nextId,
        targetType: parent.targetType,
        aipId: parent.targetType === "aip" ? parent.aipId : null,
        projectId: parent.targetType === "project" ? parent.projectId : null,
        parentFeedbackId: parent.id,
        kind: "lgu_note",
        body,
        createdAt: now,
      });

      return { replyId: nextId };
    },
  };
}
