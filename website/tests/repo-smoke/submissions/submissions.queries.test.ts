import type { ActorContext } from "@/lib/domain/actor-context";
import { AIPS_TABLE } from "@/mocks/fixtures/aip/aips.table.fixture";
import { getCitySubmissionsFeedForActor } from "@/lib/repos/submissions/queries";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

async function expectUnauthorized(
  fn: () => Promise<unknown>,
  message: string
) {
  let threwUnauthorized = false;
  try {
    await fn();
  } catch (error) {
    threwUnauthorized =
      error instanceof Error && /unauthorized/i.test(error.message);
  }
  assert(threwUnauthorized, message);
}

export async function runSubmissionsServiceTests() {
  const admin: ActorContext = { userId: "admin_001", role: "admin", scope: { kind: "none" } };
  const cityOfficial: ActorContext = {
    userId: "user_city_001",
    role: "city_official",
    scope: { kind: "city", id: "city_001" },
  };
  const barangayOfficial: ActorContext = {
    userId: "user_001",
    role: "barangay_official",
    scope: { kind: "barangay", id: "brgy_mamadid" },
  };

  const expectedCount = AIPS_TABLE.filter(
    (row) => row.scope === "barangay" && row.status !== "draft"
  ).length;

  const adminFeed = await getCitySubmissionsFeedForActor(admin);
  assert(
    adminFeed.rows.length === expectedCount,
    "Expected admin to receive city submissions feed"
  );

  const cityFeed = await getCitySubmissionsFeedForActor(cityOfficial);
  assert(
    cityFeed.rows.length === expectedCount,
    "Expected city official to receive barangay submissions"
  );

  await expectUnauthorized(
    () => getCitySubmissionsFeedForActor(barangayOfficial),
    "Expected barangay official to be unauthorized for city submissions"
  );

  await expectUnauthorized(
    () => getCitySubmissionsFeedForActor(null),
    "Expected null actor to be unauthorized for city submissions"
  );
}

