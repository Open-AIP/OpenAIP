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

  const myFeed = await getAuditFeedForActor(barangayOfficial);
  const expectedMine = ACTIVITY_LOG_FIXTURE.filter(
    (row) => row.actorId === barangayOfficial.userId
  );
  assert(
    myFeed.length === expectedMine.length,
    "Expected official to receive only own activity logs"
  );

  const citizenFeed = await getAuditFeedForActor(citizen);
  assert(citizenFeed.length === 0, "Expected citizen to receive no activity logs");
}

