import "server-only";

import type { Json } from "@/lib/contracts/databasev2";
import { supabaseServer } from "@/lib/supabase/server";
import { withWorkflowActivityMetadata } from "./workflow-metadata";

export { withWorkflowActivityMetadata } from "./workflow-metadata";

export type ActivityLogScope = {
  regionId?: string | null;
  provinceId?: string | null;
  cityId?: string | null;
  municipalityId?: string | null;
  barangayId?: string | null;
};

export type ActivityLogWriteInput = {
  action: string;
  entityTable?: string | null;
  entityId?: string | null;
  scope?: ActivityLogScope;
  metadata?: Json;
};

export type WorkflowActivityLogWriteInput = ActivityLogWriteInput & {
  hideCrudAction?: string | null;
};

function asJsonObject(
  metadata: ActivityLogWriteInput["metadata"]
): Record<string, unknown> {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {};
  }
  return metadata as Record<string, unknown>;
}

export async function writeActivityLog(
  input: ActivityLogWriteInput
): Promise<string> {
  const client = await supabaseServer();
  const { data, error } = await client.rpc("log_activity", {
    p_action: input.action,
    p_entity_table: input.entityTable ?? null,
    p_entity_id: input.entityId ?? null,
    p_region_id: input.scope?.regionId ?? null,
    p_province_id: input.scope?.provinceId ?? null,
    p_city_id: input.scope?.cityId ?? null,
    p_municipality_id: input.scope?.municipalityId ?? null,
    p_barangay_id: input.scope?.barangayId ?? null,
    p_metadata: asJsonObject(input.metadata),
  });

  if (error) {
    throw new Error(error.message);
  }

  if (typeof data !== "string" || !data) {
    throw new Error("Activity log write did not return a log id.");
  }

  return data;
}

export async function writeWorkflowActivityLog(
  input: WorkflowActivityLogWriteInput
): Promise<string> {
  return writeActivityLog({
    ...input,
    metadata: withWorkflowActivityMetadata(input.metadata, {
      hideCrudAction: input.hideCrudAction ?? null,
    }),
  });
}
