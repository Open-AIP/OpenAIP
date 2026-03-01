import "server-only";

import type { ActorContext } from "@/lib/domain/actor-context";
import { supabaseServer } from "@/lib/supabase/server";

export const BARANGAY_UPLOADER_WORKFLOW_LOCK_REASON =
  "Only the uploader of this AIP can modify this workflow.";

type AipScopeOwnershipRow = {
  id: string;
  barangay_id: string | null;
  city_id: string | null;
  municipality_id: string | null;
  created_by: string | null;
};

type UploadedFileOwnerRow = {
  uploaded_by: string | null;
};

export type BarangayWorkflowPermission = {
  canManageBarangayWorkflow: boolean;
  lockReason?: string;
  ownerUserId: string | null;
};

type AipScopeKind = "barangay" | "city" | "municipality";

function resolveScopeKind(row: AipScopeOwnershipRow): AipScopeKind {
  if (row.barangay_id) return "barangay";
  if (row.city_id) return "city";
  return "municipality";
}

export function computeBarangayWorkflowPermission(input: {
  actor: ActorContext | null | undefined;
  aipScopeKind: AipScopeKind;
  aipBarangayId: string | null;
  ownerUserId: string | null;
}): BarangayWorkflowPermission {
  const { actor, aipScopeKind, aipBarangayId, ownerUserId } = input;

  if (aipScopeKind !== "barangay") {
    return { canManageBarangayWorkflow: true, ownerUserId };
  }

  if (!actor) {
    return {
      canManageBarangayWorkflow: true,
      ownerUserId,
    };
  }

  if (actor.role === "admin") {
    return { canManageBarangayWorkflow: true, ownerUserId };
  }

  const isBarangayActor =
    actor.role === "barangay_official" &&
    actor.scope.kind === "barangay" &&
    !!actor.scope.id &&
    !!aipBarangayId &&
    actor.scope.id === aipBarangayId;

  if (!isBarangayActor) {
    return {
      canManageBarangayWorkflow: false,
      lockReason: BARANGAY_UPLOADER_WORKFLOW_LOCK_REASON,
      ownerUserId,
    };
  }

  if (!ownerUserId) {
    return {
      canManageBarangayWorkflow: false,
      lockReason: BARANGAY_UPLOADER_WORKFLOW_LOCK_REASON,
      ownerUserId,
    };
  }

  if (ownerUserId !== actor.userId) {
    return {
      canManageBarangayWorkflow: false,
      lockReason: BARANGAY_UPLOADER_WORKFLOW_LOCK_REASON,
      ownerUserId,
    };
  }

  return { canManageBarangayWorkflow: true, ownerUserId };
}

export async function getAipWorkflowOwnerUserId(aipId: string): Promise<{
  scopeKind: AipScopeKind;
  barangayId: string | null;
  ownerUserId: string | null;
} | null> {
  const client = await supabaseServer();
  const { data: aipData, error: aipError } = await client
    .from("aips")
    .select("id,barangay_id,city_id,municipality_id,created_by")
    .eq("id", aipId)
    .maybeSingle();

  if (aipError) {
    throw new Error(aipError.message);
  }
  if (!aipData) {
    return null;
  }

  const aip = aipData as AipScopeOwnershipRow;

  const { data: fileData, error: fileError } = await client
    .from("uploaded_files")
    .select("uploaded_by")
    .eq("aip_id", aipId)
    .eq("is_current", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fileError) {
    throw new Error(fileError.message);
  }

  const currentFile = fileData as UploadedFileOwnerRow | null;
  const ownerUserId = currentFile?.uploaded_by ?? aip.created_by ?? null;

  return {
    scopeKind: resolveScopeKind(aip),
    barangayId: aip.barangay_id,
    ownerUserId,
  };
}

export async function assertActorCanManageBarangayAipWorkflow(input: {
  aipId: string;
  actor: ActorContext;
}): Promise<void> {
  const ownership = await getAipWorkflowOwnerUserId(input.aipId);
  if (!ownership) {
    throw new Error("AIP not found.");
  }

  const permission = computeBarangayWorkflowPermission({
    actor: input.actor,
    aipScopeKind: ownership.scopeKind,
    aipBarangayId: ownership.barangayId,
    ownerUserId: ownership.ownerUserId,
  });

  if (!permission.canManageBarangayWorkflow) {
    throw new Error(
      permission.lockReason ?? BARANGAY_UPLOADER_WORKFLOW_LOCK_REASON
    );
  }
}
