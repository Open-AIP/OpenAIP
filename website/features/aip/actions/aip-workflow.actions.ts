"use server";

import { getAppEnv, isMockEnabled } from "@/lib/config/appEnv";
import { getActorContext } from "@/lib/domain/get-actor-context";
import { getAipProjectRepo, getAipRepo } from "@/lib/repos/aip/repo.server";
import { __getMockAipReviewsForAipId } from "@/lib/repos/submissions/repo.mock";
import { AIPS_TABLE } from "@/mocks/fixtures/aip/aips.table.fixture";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";

export type AipWorkflowActionResult =
  | { ok: true; message: string }
  | { ok: false; message: string; unresolvedAiCount?: number };

function success(message: string): AipWorkflowActionResult {
  return { ok: true, message };
}

function failure(
  message: string,
  unresolvedAiCount?: number
): AipWorkflowActionResult {
  if (typeof unresolvedAiCount === "number") {
    return { ok: false, message, unresolvedAiCount };
  }
  return { ok: false, message };
}

function isDevFallbackAllowed() {
  return getAppEnv() === "dev";
}

async function assertBarangayActor(): Promise<AipWorkflowActionResult | null> {
  const actor = await getActorContext();
  if (!actor) {
    if (isDevFallbackAllowed()) return null;
    return failure("Unauthorized.");
  }

  if (
    actor.role !== "barangay_official" ||
    actor.scope.kind !== "barangay" ||
    !actor.scope.id
  ) {
    return failure("Unauthorized.");
  }

  return null;
}

async function loadBarangayAip(aipId: string) {
  const trimmed = aipId.trim();
  if (!trimmed) return null;
  const aipRepo = getAipRepo({ defaultScope: "barangay" });
  const aip = await aipRepo.getAipDetail(trimmed);
  if (!aip || aip.scope !== "barangay") return null;
  return aip;
}

async function hasRequestRevisionHistory(aipId: string): Promise<boolean> {
  if (isMockEnabled()) {
    return __getMockAipReviewsForAipId(aipId).some(
      (item) => item.action === "request_revision"
    );
  }

  const client = await supabaseServer();
  const { data, error } = await client
    .from("aip_reviews")
    .select("id")
    .eq("aip_id", aipId)
    .eq("action", "request_revision")
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  return Array.isArray(data) && data.length > 0;
}

async function deleteAipRow(aipId: string) {
  if (isMockEnabled()) {
    const index = AIPS_TABLE.findIndex((row) => row.id === aipId);
    if (index >= 0) {
      AIPS_TABLE.splice(index, 1);
    }
    return;
  }

  const admin = supabaseAdmin();
  const { error } = await admin.from("aips").delete().eq("id", aipId);
  if (error) {
    throw new Error(error.message);
  }
}

export async function submitAipForReviewAction(input: {
  aipId: string;
}): Promise<AipWorkflowActionResult> {
  const actorError = await assertBarangayActor();
  if (actorError) return actorError;

  try {
    const aip = await loadBarangayAip(input.aipId);
    if (!aip) return failure("AIP not found.");

    if (aip.status !== "draft" && aip.status !== "for_revision") {
      return failure(
        "Submit for review is only allowed when the AIP status is Draft or For Revision."
      );
    }

    const projectRepo = getAipProjectRepo("barangay");
    const rows = await projectRepo.listByAip(aip.id);
    const unresolvedAiCount = rows.filter(
      (row) => row.reviewStatus === "ai_flagged"
    ).length;

    if (unresolvedAiCount > 0) {
      return failure(
        `Resolve all AI-flagged projects before submitting. ${unresolvedAiCount} project(s) still need an official response.`,
        unresolvedAiCount
      );
    }

    const aipRepo = getAipRepo({ defaultScope: "barangay" });
    await aipRepo.updateAipStatus(aip.id, "pending_review");

    return success("AIP submitted for review.");
  } catch (error) {
    return failure(
      error instanceof Error
        ? error.message
        : "Failed to submit AIP for review."
    );
  }
}

export async function cancelAipSubmissionAction(input: {
  aipId: string;
}): Promise<AipWorkflowActionResult> {
  const actorError = await assertBarangayActor();
  if (actorError) return actorError;

  try {
    const aip = await loadBarangayAip(input.aipId);
    if (!aip) return failure("AIP not found.");

    if (aip.status !== "pending_review") {
      return failure(
        "Cancel submission is only allowed when the AIP status is Pending Review."
      );
    }

    const aipRepo = getAipRepo({ defaultScope: "barangay" });
    await aipRepo.updateAipStatus(aip.id, "draft");
    return success("AIP submission was canceled and moved back to Draft.");
  } catch (error) {
    return failure(
      error instanceof Error
        ? error.message
        : "Failed to cancel AIP submission."
    );
  }
}

export async function deleteAipDraftAction(input: {
  aipId: string;
}): Promise<AipWorkflowActionResult> {
  const actorError = await assertBarangayActor();
  if (actorError) return actorError;

  try {
    const aip = await loadBarangayAip(input.aipId);
    if (!aip) return failure("AIP not found.");

    if (aip.status !== "draft") {
      return failure(
        "Delete draft is only allowed when the AIP status is Draft."
      );
    }

    const hasRevisionHistory = await hasRequestRevisionHistory(aip.id);
    if (hasRevisionHistory) {
      return failure(
        "This draft cannot be deleted because it was previously returned for revision."
      );
    }

    await deleteAipRow(aip.id);
    return success("Draft AIP deleted successfully.");
  } catch (error) {
    return failure(
      error instanceof Error ? error.message : "Failed to delete draft AIP."
    );
  }
}
