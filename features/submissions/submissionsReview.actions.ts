"use server";

import { getActorContext } from "@/lib/domain/get-actor-context";
import { getAppEnv } from "@/shared/config/appEnv";
import { getAipSubmissionsReviewRepo } from "./submissionsReview.repo.selector";

// [DATAFLOW] UI → server action → repo adapter (mock now; Supabase later).
// [SECURITY] This is the orchestration boundary for reviewer-only actions (request revision / publish).
// [DBV2] Writes should translate to:
//   - insert into `public.aip_reviews` (action + note, reviewer_id = actor.userId)
//   - update `public.aips.status` (under_review → for_revision | published)
// [SUPABASE-SWAP] Keep these checks even after Supabase: RLS enforces, but server-side validation gives clearer UX errors.
export async function requestRevisionAction(input: {
  aipId: string;
  note: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const trimmed = input.note.trim();
  if (!trimmed) {
    return { ok: false, message: "Revision comments are required." };
  }

  const actor = await getActorContext();
  if (!actor && getAppEnv() !== "dev") {
    return { ok: false, message: "Unauthorized." };
  }

  if (actor && actor.role !== "admin" && actor.role !== "city_official") {
    return { ok: false, message: "Unauthorized." };
  }

  try {
    const repo = getAipSubmissionsReviewRepo();
    await repo.requestRevision({ aipId: input.aipId, note: trimmed, actor });
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Failed to request revision.",
    };
  }
}

export async function publishAipAction(input: {
  aipId: string;
  note?: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const trimmed = typeof input.note === "string" ? input.note.trim() : "";

  const actor = await getActorContext();
  if (!actor && getAppEnv() !== "dev") {
    return { ok: false, message: "Unauthorized." };
  }

  if (actor && actor.role !== "admin" && actor.role !== "city_official") {
    return { ok: false, message: "Unauthorized." };
  }

  try {
    const repo = getAipSubmissionsReviewRepo();
    await repo.publishAip({
      aipId: input.aipId,
      note: trimmed ? trimmed : undefined,
      actor,
    });
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Failed to publish AIP.",
    };
  }
}
