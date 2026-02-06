import { AIP_IDS } from "@/features/shared/mock/id-contract";
import { AIPS_TABLE } from "@/features/aip/mock/aips.table";
import {
  __getMockAipReviewsForAipId,
  __resetMockAipSubmissionsReviewState,
  createMockAipSubmissionsReviewRepo,
} from "../../submissionsReview.repo.mock";

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

  {
    resetAipsTable();
    __resetMockAipSubmissionsReviewState();
    await repo.startReviewIfNeeded({ aipId, actor });

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
    await repo.startReviewIfNeeded({ aipId, actor });

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
    await repo.startReviewIfNeeded({ aipId, actor });

    const before = __getMockAipReviewsForAipId(aipId).length;
    const next = await repo.publishAip({ aipId, actor });
    const after = __getMockAipReviewsForAipId(aipId).length;

    assert(next === "published", "Expected publishAip to set status published");
    assert(after === before + 1, "Expected approve review record appended");

    const detail = await repo.getSubmissionAipDetail({ aipId, actor });
    assert(detail?.aip.status === "published", "Expected AIP to be published after publishAip");
    assert(!!detail?.aip.publishedAt, "Expected AIP.publishedAt to be set");
  }

  resetAipsTable();
  __resetMockAipSubmissionsReviewState();
}

