"use server";

import { getActorContext } from "@/lib/domain/get-actor-context";
import { getAipRepo, getAipProjectRepo } from "@/lib/repos/aip/repo.server";
import { assertActorCanManageBarangayAipWorkflow } from "@/lib/repos/aip/workflow-permissions.server";
import type { AipProjectRow, SubmitReviewInput } from "@/lib/repos/aip/repo";

export async function listAipProjectsAction(aipId: string): Promise<AipProjectRow[]> {
  if (!aipId.trim()) return [];
  const repo = getAipProjectRepo();
  return repo.listByAip(aipId);
}

async function assertProjectEditOwnership(aipId: string): Promise<void> {
  const actor = await getActorContext();
  if (!actor) {
    throw new Error("Unauthorized");
  }

  const aipRepo = getAipRepo({ defaultScope: "barangay" });
  const aip = await aipRepo.getAipDetail(aipId, actor);
  if (!aip) {
    throw new Error("AIP not found.");
  }

  if (aip.scope !== "barangay") return;
  await assertActorCanManageBarangayAipWorkflow({ aipId, actor });
}

export async function submitAipProjectReviewAction(input: SubmitReviewInput): Promise<AipProjectRow> {
  const reason = input.reason.trim();
  if (!reason) {
    throw new Error("Review comment is required.");
  }

  await assertProjectEditOwnership(input.aipId);

  const repo = getAipProjectRepo();
  return repo.submitReview({
    ...input,
    reason,
  });
}
