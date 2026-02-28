import type { Json } from "@/lib/contracts/databasev2";

function asJsonObject(metadata?: Json | null): Record<string, unknown> {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {};
  }
  return metadata as Record<string, unknown>;
}

function normalizeNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function withWorkflowActivityMetadata(
  metadata?: Json | null,
  options?: { hideCrudAction?: string | null }
): Json {
  const merged = asJsonObject(metadata);
  merged.source = "workflow";

  const hideCrudAction = normalizeNonEmptyString(options?.hideCrudAction);
  if (hideCrudAction) {
    merged.hide_crud_action = hideCrudAction;
  }

  return merged as Json;
}
