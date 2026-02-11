import type { AipStatus, ReviewAction } from "@/lib/contracts/databasev2";
import type { ActorContext } from "@/lib/domain/actor-context";
import type { AipHeader } from "@/lib/repos/aip/repo";
import { AIPS_TABLE } from "@/mocks/fixtures/aip/aips.table.fixture";
import type { AipSubmissionsReviewRepo, AipSubmissionRow, LatestReview, ListSubmissionsResult } from "./repo";

// [DATAFLOW] Mock implementation of the DBV2 review workflow:
//   AIP status changes live in `AIPS_TABLE`, while reviewer decisions are appended to `reviewStore` below.
// [DBV2] In Supabase, `reviewStore` maps to `public.aip_reviews` (append-only) and AIP status maps to `public.aips.status`.
type MockAipReviewRow = {
  id: string;
  aipId: string;
  reviewerId: string;
  reviewerName: string;
  action: ReviewAction;
  note: string | null;
  createdAt: string;
};

const MOCK_CITY_ID = "city_001";
const MOCK_REVIEWER_ID = "profile_city_001";
const MOCK_REVIEWER_NAME = "Juan Dela Cruz";

const MOCK_CITY_BY_AIP_ID: Record<string, string> = Object.fromEntries(
  AIPS_TABLE.filter((aip) => aip.scope === "barangay").map((aip) => [aip.id, MOCK_CITY_ID])
);

const SEED_REVIEW_NOTES_BY_AIP_ID: Record<string, string> = {
  "aip-2026-sanisidro":
    "Budget allocation for medical equipment needs to be itemized. Please provide detailed specifications for the vaccination storage facility.",
  "aip-2026-mamadid":
    "Please provide more detailed cost breakdown for the multi-purpose hall project.",
};

let reviewStore: MockAipReviewRow[] = [];
let reviewSequence = 1;

function nextReviewId() {
  const id = `aiprev_${String(reviewSequence).padStart(3, "0")}`;
  reviewSequence += 1;
  return id;
}

function nowIso() {
  return new Date().toISOString();
}

function todayIsoDate() {
  return new Date().toISOString().split("T")[0] ?? "";
}

function seedReviewStore() {
  const seeded: MockAipReviewRow[] = [];

  for (const aip of AIPS_TABLE) {
    if (aip.scope !== "barangay") continue;

    if (aip.status === "published") {
      seeded.push({
        id: nextReviewId(),
        aipId: aip.id,
        reviewerId: MOCK_REVIEWER_ID,
        reviewerName: MOCK_REVIEWER_NAME,
        action: "approve",
        note: null,
        createdAt: aip.publishedAt ? new Date(aip.publishedAt).toISOString() : nowIso(),
      });
    }

    if (aip.status === "for_revision") {
      seeded.push({
        id: nextReviewId(),
        aipId: aip.id,
        reviewerId: MOCK_REVIEWER_ID,
        reviewerName: MOCK_REVIEWER_NAME,
        action: "request_revision",
        note: SEED_REVIEW_NOTES_BY_AIP_ID[aip.id] ?? "Please revise and resubmit.",
        createdAt: nowIso(),
      });
    }
  }

  reviewStore = seeded;
}

seedReviewStore();

function requireCityReviewer(actor: ActorContext | null, cityId: string) {
  if (!actor) {
    // Dev UX: allow mock browsing when auth context is missing.
    return;
  }

  if (actor.role !== "admin" && actor.role !== "city_official") {
    throw new Error("Unauthorized.");
  }

  if (actor.role === "city_official") {
    if (actor.scope.kind !== "city" || !actor.scope.id) {
      throw new Error("Unauthorized.");
    }
    if (actor.scope.id !== cityId) {
      throw new Error("Unauthorized.");
    }
  }
}

function latestReviewForAip(aipId: string): MockAipReviewRow | null {
  const rows = reviewStore.filter((row) => row.aipId === aipId);
  if (rows.length === 0) return null;
  return rows.reduce((latest, row) =>
    new Date(row.createdAt).getTime() > new Date(latest.createdAt).getTime()
      ? row
      : latest
  );
}

export function getLatestMockAipRevisionNote(aipId: string): string | null {
  const rows = reviewStore
    .filter((row) => row.aipId === aipId && row.action === "request_revision")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return rows[0]?.note ?? null;
}

function sortNewestFirst(rows: AipSubmissionRow[]): AipSubmissionRow[] {
  return [...rows].sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1));
}

function buildCounts(rows: AipSubmissionRow[]) {
  return {
    total: rows.length,
    published: rows.filter((r) => r.status === "published").length,
    underReview: rows.filter((r) => r.status === "under_review").length,
    pendingReview: rows.filter((r) => r.status === "pending_review").length,
    forRevision: rows.filter((r) => r.status === "for_revision").length,
  };
}

function toLatestReview(row: MockAipReviewRow | null): LatestReview {
  if (!row) return null;
  return {
    reviewerId: row.reviewerId,
    reviewerName: row.reviewerName,
    action: row.action,
    note: row.note,
    createdAt: row.createdAt,
  };
}

function getBarangayCityId(aipId: string): string | null {
  return MOCK_CITY_BY_AIP_ID[aipId] ?? null;
}

function assertInJurisdiction(aip: AipHeader, cityId: string) {
  if (aip.scope !== "barangay") {
    throw new Error("AIP is not a barangay submission.");
  }

  const aipCityId = getBarangayCityId(aip.id);
  if (!aipCityId) {
    throw new Error("AIP is missing jurisdiction mapping.");
  }
  if (aipCityId !== cityId) {
    throw new Error("AIP is outside jurisdiction.");
  }
}

export function __resetMockAipSubmissionsReviewState() {
  // Reset review store only (AIPS_TABLE is reset elsewhere, if needed).
  reviewStore = [];
  reviewSequence = 1;
  seedReviewStore();
}

export function __getMockAipReviewsForAipId(aipId: string): MockAipReviewRow[] {
  return reviewStore.filter((row) => row.aipId === aipId);
}

export function createMockAipSubmissionsReviewRepo(): AipSubmissionsReviewRepo {
  return {
    async listSubmissionsForCity({
      cityId,
      actor,
    }): Promise<ListSubmissionsResult> {
      requireCityReviewer(actor, cityId);

      const baseRows = AIPS_TABLE.filter(
        (aip) =>
          aip.scope === "barangay" &&
          aip.status !== "draft" &&
          getBarangayCityId(aip.id) === cityId
      ).map((aip) => {
        const latest = latestReviewForAip(aip.id);
        return {
          id: aip.id,
          title: aip.title,
          year: aip.year,
          status: aip.status,
          scope: "barangay",
          barangayName: aip.barangayName ?? null,
          uploadedAt: aip.uploadedAt,
          reviewerName: latest?.reviewerName ?? null,
        } satisfies AipSubmissionRow;
      });

      const rows = sortNewestFirst(baseRows);
      return { rows, counts: buildCounts(rows) };
    },

    async getSubmissionAipDetail({ aipId, actor }) {
      const aip = AIPS_TABLE.find((row) => row.id === aipId) ?? null;
      if (!aip) return null;

      // Determine jurisdiction context:
      const cityId =
        actor?.role === "city_official" && actor.scope.kind === "city"
          ? actor.scope.id
          : MOCK_CITY_ID;
      if (!cityId) return null;

      requireCityReviewer(actor, cityId);
      assertInJurisdiction(aip, cityId);

      const latest = latestReviewForAip(aipId);
      return { aip, latestReview: toLatestReview(latest) };
    },

    async startReviewIfNeeded({ aipId, actor }): Promise<AipStatus> {
      const aip = AIPS_TABLE.find((row) => row.id === aipId) ?? null;
      if (!aip) throw new Error("AIP not found.");

      const cityId =
        actor?.role === "city_official" && actor.scope.kind === "city"
          ? actor.scope.id
          : MOCK_CITY_ID;
      if (!cityId) throw new Error("Unauthorized.");

      requireCityReviewer(actor, cityId);
      assertInJurisdiction(aip, cityId);

      if (aip.status !== "pending_review") return aip.status;

      const index = AIPS_TABLE.findIndex((row) => row.id === aipId);
      AIPS_TABLE[index] = { ...aip, status: "under_review" };
      return "under_review";
    },

    async requestRevision({ aipId, note, actor }): Promise<AipStatus> {
      const trimmed = note.trim();
      if (!trimmed) throw new Error("Revision comments are required.");

      const aip = AIPS_TABLE.find((row) => row.id === aipId) ?? null;
      if (!aip) throw new Error("AIP not found.");

      const cityId =
        actor?.role === "city_official" && actor.scope.kind === "city"
          ? actor.scope.id
          : MOCK_CITY_ID;
      if (!cityId) throw new Error("Unauthorized.");

      requireCityReviewer(actor, cityId);
      assertInJurisdiction(aip, cityId);

      if (aip.status !== "under_review") {
        throw new Error("Request Revision is only allowed when the AIP is under review.");
      }

      reviewStore = [
        ...reviewStore,
        {
          id: nextReviewId(),
          aipId,
          reviewerId: actor?.userId ?? MOCK_REVIEWER_ID,
          reviewerName: MOCK_REVIEWER_NAME,
          action: "request_revision",
          note: trimmed,
          createdAt: nowIso(),
        },
      ];

      const index = AIPS_TABLE.findIndex((row) => row.id === aipId);
      AIPS_TABLE[index] = { ...aip, status: "for_revision" };
      return "for_revision";
    },

    async publishAip({ aipId, note, actor }): Promise<AipStatus> {
      const trimmed = typeof note === "string" ? note.trim() : "";

      const aip = AIPS_TABLE.find((row) => row.id === aipId) ?? null;
      if (!aip) throw new Error("AIP not found.");

      const cityId =
        actor?.role === "city_official" && actor.scope.kind === "city"
          ? actor.scope.id
          : MOCK_CITY_ID;
      if (!cityId) throw new Error("Unauthorized.");

      requireCityReviewer(actor, cityId);
      assertInJurisdiction(aip, cityId);

      if (aip.status !== "under_review") {
        throw new Error("Publish is only allowed when the AIP is under review.");
      }

      reviewStore = [
        ...reviewStore,
        {
          id: nextReviewId(),
          aipId,
          reviewerId: actor?.userId ?? MOCK_REVIEWER_ID,
          reviewerName: MOCK_REVIEWER_NAME,
          action: "approve",
          note: trimmed ? trimmed : null,
          createdAt: nowIso(),
        },
      ];

      const index = AIPS_TABLE.findIndex((row) => row.id === aipId);
      AIPS_TABLE[index] = { ...aip, status: "published", publishedAt: todayIsoDate() };
      return "published";
    },

    async getLatestReview({ aipId }): Promise<LatestReview> {
      return toLatestReview(latestReviewForAip(aipId));
    },
  };
}
