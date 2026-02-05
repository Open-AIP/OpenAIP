import type { ActorContext } from "@/lib/domain/actor-context";
import { AIP_SUBMISSIONS_MOCK } from "../../mock/aip-submissions.mock";
import { getCitySubmissionsFeedForActor } from "../submissionsService";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
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

  const adminFeed = await getCitySubmissionsFeedForActor(admin);
  assert(
    adminFeed.length === AIP_SUBMISSIONS_MOCK.filter((row) => row.scope === "barangay").length,
    "Expected admin to receive city submissions feed"
  );

  const cityFeed = await getCitySubmissionsFeedForActor(cityOfficial);
  assert(
    cityFeed.length === AIP_SUBMISSIONS_MOCK.filter((row) => row.scope === "barangay").length,
    "Expected city official to receive barangay submissions"
  );

  const barangayFeed = await getCitySubmissionsFeedForActor(barangayOfficial);
  assert(barangayFeed.length === 0, "Expected barangay official to receive no city submissions");
}

