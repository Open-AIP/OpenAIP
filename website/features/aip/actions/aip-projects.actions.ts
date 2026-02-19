"use server";

import { getAipProjectRepo } from "@/lib/repos/aip/repo.server";
import type { AipProjectRow, SubmitReviewInput } from "@/lib/repos/aip/repo";

export async function listAipProjectsAction(aipId: string): Promise<AipProjectRow[]> {
  if (!aipId.trim()) return [];
  const repo = getAipProjectRepo();
  return repo.listByAip(aipId);
}

export async function submitAipProjectReviewAction(input: SubmitReviewInput): Promise<void> {
  const comment = input.comment.trim();
  if (!comment) {
    throw new Error("Review comment is required.");
  }

  const repo = getAipProjectRepo();
  await repo.submitReview({
    ...input,
    comment,
  });
}
