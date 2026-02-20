import { AIPS_TABLE } from "@/mocks/fixtures/aip/aips.table.fixture";
import { AIP_IDS } from "@/mocks/fixtures/shared/id-contract.fixture";
import {
  __getMockAipReviewsForAipId,
  __resetMockAipSubmissionsReviewState,
  createMockAipSubmissionsReviewRepo,
} from "@/lib/repos/submissions/repo.mock";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const initialAipsSnapshot = AIPS_TABLE.map((row) => JSON.parse(JSON.stringify(row)));

function resetAipsTable() {
  for (let i = 0; i < initialAipsSnapshot.length; i += 1) {
    AIPS_TABLE[i] = JSON.parse(JSON.stringify(initialAipsSnapshot[i]));
  }
}

export async function runSubmissionsReviewRepoTests() {
  const repo = createMockAipSubmissionsReviewRepo();
  const aipId = AIP_IDS.barangay_mamadid_2026;
  const actor = {
    userId: "user_city_001",
    role: "city_official" as const,
    scope: { kind: "city" as const, id: "city_001" },
  };
  const otherActor = {
    userId: "user_city_002",
    role: "city_official" as const,
    scope: { kind: "city" as const, id: "city_001" },
  };
  const adminActor = {
    userId: "admin_001",
    role: "admin" as const,
    scope: { kind: "none" as const },
  };

  {
    resetAipsTable();
    __resetMockAipSubmissionsReviewState();

    const detail = await repo.getSubmissionAipDetail({
      aipId: AIP_IDS.barangay_sanisidro_2026,
      actor,
    });
    assert(!!detail, "Expected submission detail for San Isidro AIP");
    assert(
      (detail?.aip.revisionFeedbackCycles?.length ?? 0) > 0,
      "Expected revision feedback cycles to be populated"
    );
    assert(
      detail?.aip.revisionFeedbackCycles?.[0]?.reviewerRemark.authorRole === "reviewer",
      "Expected reviewer remark in revision feedback cycle"
    );
  }

  {
    resetAipsTable();
    __resetMockAipSubmissionsReviewState();

    const testAipId = AIP_IDS.barangay_mamadid_2026;
    const index = AIPS_TABLE.findIndex((row) => row.id === testAipId);
    AIPS_TABLE[index] = { ...AIPS_TABLE[index], status: "under_review" };

    await repo.claimReview({ aipId: testAipId, actor });
    await repo.requestRevision({
      aipId: testAipId,
      note: "First revision cycle note",
      actor,
    });

    AIPS_TABLE[index] = { ...AIPS_TABLE[index], status: "under_review" };
    await repo.claimReview({ aipId: testAipId, actor });
    await repo.requestRevision({
      aipId: testAipId,
      note: "Second revision cycle note",
      actor,
    });

    const detail = await repo.getSubmissionAipDetail({ aipId: testAipId, actor });
    const cycles = detail?.aip.revisionFeedbackCycles ?? [];
    assert(cycles.length >= 2, "Expected at least 2 revision feedback cycles");
    assert(
      cycles[0]?.reviewerRemark.body === "Second revision cycle note",
      "Expected newest revision cycle first"
    );
    assert(
      cycles[1]?.reviewerRemark.body === "First revision cycle note",
      "Expected older revision cycle second"
    );
  }

  {
    resetAipsTable();
    __resetMockAipSubmissionsReviewState();

    let threwUnauthorized = false;
    try {
      await repo.listSubmissionsForCity({ cityId: "city_001", actor: null });
    } catch (error) {
      threwUnauthorized =
        error instanceof Error && /unauthorized/i.test(error.message);
    }

    assert(
      threwUnauthorized,
      "Expected listSubmissionsForCity to reject null actor"
    );
  }

  {
    resetAipsTable();
    __resetMockAipSubmissionsReviewState();
    const index = AIPS_TABLE.findIndex((row) => row.id === aipId);
    const next = await repo.claimReview({ aipId, actor });
    const latest = await repo.getLatestReview({ aipId });
    let feed = await repo.listSubmissionsForCity({ cityId: "city_001", actor });
    let claimed = feed.rows.find((row) => row.id === aipId);

    assert(next === "under_review", "Expected claimReview to move pending AIP under_review");
    assert(latest?.action === "claim_review", "Expected latest action to be claim_review");
    assert(
      claimed?.reviewerName === actor.userId,
      "Expected claimed AIP reviewer column to show the claimer"
    );

    await repo.requestRevision({
      aipId,
      note: "Please revise and resubmit.",
      actor,
    });

    feed = await repo.listSubmissionsForCity({ cityId: "city_001", actor });
    claimed = feed.rows.find((row) => row.id === aipId);
    assert(
      claimed?.reviewerName === null,
      "Expected reviewer column to clear once latest action is request_revision"
    );

    const current = AIPS_TABLE[index];
    AIPS_TABLE[index] = { ...current, status: "pending_review" };

    feed = await repo.listSubmissionsForCity({ cityId: "city_001", actor });
    claimed = feed.rows.find((row) => row.id === aipId);
    assert(
      claimed?.reviewerName === null,
      "Expected resubmitted pending_review AIP to remain unassigned before a new claim"
    );

    await repo.claimReview({ aipId, actor: otherActor });
    feed = await repo.listSubmissionsForCity({ cityId: "city_001", actor });
    claimed = feed.rows.find((row) => row.id === aipId);
    assert(
      claimed?.reviewerName === otherActor.userId,
      "Expected reviewer column to show the new claimer after resubmission"
    );
  }

  {
    resetAipsTable();
    __resetMockAipSubmissionsReviewState();
    await repo.claimReview({ aipId, actor });

    const before = __getMockAipReviewsForAipId(aipId).length;
    let threw = false;
    try {
      await repo.requestRevision({ aipId, note: "   ", actor });
    } catch {
      threw = true;
    }
    const after = __getMockAipReviewsForAipId(aipId).length;

    assert(threw, "Expected requestRevision to reject empty note");
    assert(after === before, "Expected no review record appended on validation error");
  }

  {
    resetAipsTable();
    __resetMockAipSubmissionsReviewState();
    await repo.claimReview({ aipId, actor });

    const before = __getMockAipReviewsForAipId(aipId).length;
    const next = await repo.requestRevision({
      aipId,
      note: "Please provide an itemized cost breakdown.",
      actor,
    });
    const after = __getMockAipReviewsForAipId(aipId).length;

    assert(next === "for_revision", "Expected requestRevision to set status for_revision");
    assert(after === before + 1, "Expected review record appended");

    const latest = await repo.getLatestReview({ aipId });
    assert(latest?.action === "request_revision", "Expected latest action to be request_revision");
    assert(
      latest?.note === "Please provide an itemized cost breakdown.",
      "Expected latest note to match input"
    );
  }

  {
    resetAipsTable();
    __resetMockAipSubmissionsReviewState();
    await repo.claimReview({ aipId, actor });

    const before = __getMockAipReviewsForAipId(aipId).length;
    const next = await repo.publishAip({ aipId, actor });
    const after = __getMockAipReviewsForAipId(aipId).length;

    assert(next === "published", "Expected publishAip to set status published");
    assert(after === before + 1, "Expected approve review record appended");

    const detail = await repo.getSubmissionAipDetail({ aipId, actor });
    assert(detail?.aip.status === "published", "Expected AIP to be published after publishAip");
    assert(!!detail?.aip.publishedAt, "Expected AIP.publishedAt to be set");
  }

  {
    resetAipsTable();
    __resetMockAipSubmissionsReviewState();
    await repo.claimReview({ aipId, actor });

    let threw = false;
    try {
      await repo.publishAip({ aipId, actor: otherActor });
    } catch (error) {
      threw = error instanceof Error && /assigned to another reviewer/i.test(error.message);
    }
    assert(threw, "Expected non-owner to be blocked from publish");
  }

  {
    resetAipsTable();
    __resetMockAipSubmissionsReviewState();
    await repo.claimReview({ aipId, actor });
    await repo.claimReview({ aipId, actor: adminActor });

    const latest = await repo.getLatestReview({ aipId });
    assert(
      latest?.reviewerId === adminActor.userId && latest.action === "claim_review",
      "Expected admin takeover to create a new claim_review row"
    );

    const next = await repo.publishAip({ aipId, actor: adminActor });
    assert(next === "published", "Expected admin to publish after takeover");
  }

  {
    resetAipsTable();
    __resetMockAipSubmissionsReviewState();

    const index = AIPS_TABLE.findIndex((row) => row.id === aipId);
    const current = AIPS_TABLE[index];
    AIPS_TABLE[index] = { ...current, status: "under_review" };

    const before = __getMockAipReviewsForAipId(aipId).length;
    await repo.claimReview({ aipId, actor });
    const after = __getMockAipReviewsForAipId(aipId).length;
    assert(after === before + 1, "Expected claim on legacy under_review AIP to append row");
  }

  resetAipsTable();
  __resetMockAipSubmissionsReviewState();
}

