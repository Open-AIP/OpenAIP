import type { ActorContext } from "@/lib/domain/actor-context";
import { getActorContext } from "@/lib/domain/get-actor-context";
import type { AipSubmissionItem } from "../types/submissions.types";
import { getSubmissionsRepo } from "../data/submissionsRepo.selector";
import { getAppEnv } from "@/shared/config/appEnv";

export async function getCitySubmissionsFeed(): Promise<AipSubmissionItem[]> {
  const actor = await getActorContext();
  return getCitySubmissionsFeedForActor(actor);
}

export async function getCitySubmissionsFeedForActor(
  actor: ActorContext | null
): Promise<AipSubmissionItem[]> {
  if (!actor) {
    // Dev UX: allow viewing mock submissions even if auth context is missing.
    // This keeps the page usable while auth/session wiring is in flux.
    if (getAppEnv() === "dev") {
      const repo = getSubmissionsRepo();
      return repo.listBarangaySubmissions();
    }
    return [];
  }

  if (actor.role !== "admin" && actor.role !== "city_official") {
    return [];
  }

  const repo = getSubmissionsRepo();
  return repo.listBarangaySubmissions();
}

