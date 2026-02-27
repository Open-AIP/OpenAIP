import type { ActorContext } from "@/lib/domain/actor-context";
import { ACTIVITY_LOG_FIXTURE } from "@/mocks/fixtures/audit/activity-log.fixture";
import { getAuditFeedForActor } from "@/lib/repos/audit/queries";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

export async function runAuditServiceTests() {
  const admin: ActorContext = {
    userId: "admin_001",
    role: "admin",
    scope: { kind: "none" },
  };
  const barangayOfficial: ActorContext = {
    userId: "user_001",
    role: "barangay_official",
    scope: { kind: "barangay", id: "brgy_mamadid" },
  };
  const cityOfficial: ActorContext = {
    userId: "user_002",
    role: "city_official",
    scope: { kind: "city", id: "city_001" },
  };
  const citizen: ActorContext = {
    userId: "citizen_001",
    role: "citizen",
    scope: { kind: "barangay", id: "brgy_mamadid" },
  };

  const adminFeed = await getAuditFeedForActor(admin);
  assert(
    adminFeed.length === ACTIVITY_LOG_FIXTURE.length,
    "Expected admin to receive all activity logs"
  );

  const barangayFeed = await getAuditFeedForActor(barangayOfficial);
  const expectedBarangay = ACTIVITY_LOG_FIXTURE.filter(
    (row) =>
      row.actorRole === "barangay_official" &&
      row.scope?.scope_type === "barangay" &&
      row.scope.barangay_id === "brgy_mamadid"
  );
  assert(
    barangayFeed.length === expectedBarangay.length,
    "Expected barangay official to receive same-barangay barangay-official activity logs"
  );
  assert(
    barangayFeed.some((row) => row.actorId !== barangayOfficial.userId),
    "Expected barangay feed to include co-official actions in the same barangay"
  );
  assert(
    barangayFeed.every((row) => row.scope?.scope_type === "barangay"),
    "Expected barangay feed to include only barangay-scoped activity rows"
  );
  assert(
    barangayFeed.every((row) => row.scope?.barangay_id === "brgy_mamadid"),
    "Expected barangay feed to exclude other barangays"
  );

  const cityFeed = await getAuditFeedForActor(cityOfficial);
  const expectedCityOwn = ACTIVITY_LOG_FIXTURE.filter(
    (row) => row.actorId === cityOfficial.userId
  );
  assert(
    cityFeed.length === expectedCityOwn.length,
    "Expected city official behavior to remain own-activity based"
  );

  const citizenFeed = await getAuditFeedForActor(citizen);
  assert(citizenFeed.length === 0, "Expected citizen to receive no activity logs");
}

