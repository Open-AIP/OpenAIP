import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";
import type { AuditRepo } from "./repo";
import type { ActivityLogRow, ActivityScopeSnapshot } from "./types";

type ActivityLogSelectRow = {
  id: string;
  actor_id: string | null;
  actor_role: string | null;
  action: string;
  entity_table: string | null;
  entity_id: string | null;
  city_id: string | null;
  municipality_id: string | null;
  barangay_id: string | null;
  metadata: unknown;
  created_at: string;
};

type ProfileSelectRow = {
  id: string;
  full_name: string | null;
  email: string | null;
};

const EMPTY_UUID = "00000000-0000-0000-0000-000000000000";

const SELECT_COLUMNS = [
  "id",
  "actor_id",
  "actor_role",
  "action",
  "entity_table",
  "entity_id",
  "city_id",
  "municipality_id",
  "barangay_id",
  "metadata",
  "created_at",
].join(",");

type ActivityLogFilters = {
  actorId?: string;
  actorRole?: string;
  barangayId?: string;
};

function toScope(row: ActivityLogSelectRow): ActivityScopeSnapshot {
  if (row.barangay_id) {
    return {
      scope_type: "barangay",
      barangay_id: row.barangay_id,
      city_id: null,
      municipality_id: null,
    };
  }

  if (row.city_id) {
    return {
      scope_type: "city",
      barangay_id: null,
      city_id: row.city_id,
      municipality_id: null,
    };
  }

  if (row.municipality_id) {
    return {
      scope_type: "municipality",
      barangay_id: null,
      city_id: null,
      municipality_id: row.municipality_id,
    };
  }

  return {
    scope_type: "none",
    barangay_id: null,
    city_id: null,
    municipality_id: null,
  };
}

function toNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toMetadataObject(
  metadata: unknown
): Record<string, unknown> {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {};
  }
  return { ...(metadata as Record<string, unknown>) };
}

function mapActivityRow(
  row: ActivityLogSelectRow,
  profileById: Map<string, ProfileSelectRow>
): ActivityLogRow {
  const metadata = toMetadataObject(row.metadata);
  const profile = row.actor_id ? profileById.get(row.actor_id) : undefined;
  const profileActorName =
    toNonEmptyString(profile?.full_name) ?? toNonEmptyString(profile?.email);
  const metadataActorName = toNonEmptyString(metadata.actor_name);
  const actorName = profileActorName ?? metadataActorName;
  if (actorName) {
    metadata.actor_name = actorName;
  }

  return {
    id: row.id,
    actorId: row.actor_id ?? EMPTY_UUID,
    action: row.action,
    entityType: row.entity_table ?? "activity_log",
    entityId: row.entity_id ?? row.id,
    scope: toScope(row),
    metadata:
      Object.keys(metadata).length > 0
        ? (metadata as ActivityLogRow["metadata"])
        : null,
    actorRole: (row.actor_role as ActivityLogRow["actorRole"]) ?? null,
    createdAt: row.created_at,
  };
}

async function listActivityRows(
  filters: ActivityLogFilters = {}
): Promise<ActivityLogRow[]> {
  const admin = supabaseAdmin();
  let query = admin
    .from("activity_log")
    .select(SELECT_COLUMNS)
    .order("created_at", { ascending: false });

  if (filters.actorId) {
    query = query.eq("actor_id", filters.actorId);
  }

  if (filters.actorRole) {
    query = query.eq("actor_role", filters.actorRole);
  }

  if (filters.barangayId) {
    query = query.eq("barangay_id", filters.barangayId);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  const rows = ((data ?? []) as unknown[]).map(
    (row) => row as ActivityLogSelectRow
  );
  const actorIds = Array.from(
    new Set(
      rows
        .map((row) => row.actor_id)
        .filter((id): id is string => typeof id === "string" && id.length > 0)
    )
  );

  const profileById = new Map<string, ProfileSelectRow>();
  if (actorIds.length > 0) {
    const { data: profiles, error: profilesError } = await admin
      .from("profiles")
      .select("id,full_name,email")
      .in("id", actorIds);

    if (profilesError) {
      throw new Error(profilesError.message);
    }

    ((profiles ?? []) as unknown[]).forEach((row) => {
      const profile = row as ProfileSelectRow;
      profileById.set(profile.id, profile);
    });
  }

  return rows.map((row) => mapActivityRow(row, profileById));
}

export function createSupabaseAuditRepo(): AuditRepo {
  return {
    async listMyActivity(actorId: string): Promise<ActivityLogRow[]> {
      return listActivityRows({ actorId });
    },
    async listBarangayOfficialActivity(
      barangayId: string
    ): Promise<ActivityLogRow[]> {
      return listActivityRows({
        actorRole: "barangay_official",
        barangayId,
      });
    },
    async listAllActivity(): Promise<ActivityLogRow[]> {
      return listActivityRows();
    },
  };
}
