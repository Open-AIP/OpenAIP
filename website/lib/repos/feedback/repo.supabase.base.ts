import type { FeedbackKind, RoleType } from "@/lib/contracts/databasev2";
import { withWorkflowActivityMetadata } from "@/lib/audit/workflow-metadata";
import {
  CITIZEN_INITIATED_FEEDBACK_KINDS,
  isCitizenInitiatedFeedbackKind,
} from "@/lib/constants/feedback-kind";
import {
  buildFeedbackLguLabel,
  toFeedbackAuthorDisplayRole,
  toFeedbackRoleLabel,
} from "@/lib/feedback/author-labels";
import type {
  CommentRepo,
  CommentTargetLookup,
  CreateFeedbackInput,
  FeedbackItem,
  FeedbackRepo,
  FeedbackTarget,
  FeedbackThreadRow,
  FeedbackThreadsRepo,
} from "./repo";
import type { CommentMessage, CommentThread } from "./types";

type SupabaseClientLike = {
  from: (table: string) => any;
  rpc?: (...args: any[]) => any;
  auth?: {
    getUser: () => Promise<{
      data: { user: { id: string } | null };
      error: { message: string } | null;
    }>;
  };
};

type GetClient = () => Promise<SupabaseClientLike>;

type FeedbackSelectRow = {
  id: string;
  target_type: "aip" | "project";
  aip_id: string | null;
  project_id: string | null;
  parent_feedback_id: string | null;
  source: "human" | "ai";
  kind: FeedbackKind;
  body: string;
  author_id: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
};

type ProfileSelectRow = {
  id: string;
  role: RoleType | null;
  full_name: string | null;
  barangay_id: string | null;
  city_id: string | null;
  municipality_id: string | null;
};

type ScopeNameMaps = {
  barangayNameById: Map<string, string>;
  cityNameById: Map<string, string>;
  municipalityNameById: Map<string, string>;
};

type ProjectLookupRow = {
  id: string;
  aip_id: string;
  aip_ref_code: string;
  program_project_description: string;
  category: string;
  start_date: string | null;
  completion_date: string | null;
};

type AipLookupRow = {
  id: string;
  fiscal_year: number;
  barangay_id: string | null;
  city_id: string | null;
  municipality_id: string | null;
};

const FEEDBACK_SELECT_COLUMNS = [
  "id",
  "target_type",
  "aip_id",
  "project_id",
  "parent_feedback_id",
  "source",
  "kind",
  "body",
  "author_id",
  "is_public",
  "created_at",
  "updated_at",
].join(",");

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function toCommentAuthorRole(
  role: RoleType | null | undefined
): CommentMessage["authorRole"] {
  if (role === "barangay_official") return "barangay_official";
  if (role === "city_official" || role === "municipal_official") {
    return "city_official";
  }
  if (role === "admin") return "admin";
  return "citizen";
}

function mapFeedbackRowToItem(row: FeedbackSelectRow): FeedbackItem {
  return {
    id: row.id,
    targetType: row.target_type,
    aipId: row.aip_id,
    projectId: row.project_id,
    parentFeedbackId: row.parent_feedback_id,
    kind: row.kind,
    body: row.body,
    authorId: row.author_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isPublic: row.is_public,
  };
}

function mapFeedbackRowToThreadRow(row: FeedbackSelectRow): FeedbackThreadRow {
  return {
    id: row.id,
    target_type: row.target_type,
    aip_id: row.aip_id,
    project_id: row.project_id,
    parent_feedback_id: row.parent_feedback_id,
    body: row.body,
    author_id: row.author_id ?? "system",
    created_at: row.created_at,
  };
}

function toCommentTarget(row: FeedbackSelectRow): CommentThread["target"] {
  if (row.target_type === "project" && row.project_id) {
    return {
      targetKind: "project",
      projectId: row.project_id,
    };
  }

  return {
    targetKind: "aip_item",
    aipId: row.aip_id ?? "unknown",
    aipItemId: row.id,
  };
}

function getYearFromDateString(value?: string | null): number | undefined {
  if (!value) return undefined;
  const year = new Date(value).getFullYear();
  if (!Number.isFinite(year)) return undefined;
  return year;
}

async function listFeedbackRowsByParentIds(
  client: SupabaseClientLike,
  parentIds: string[]
): Promise<FeedbackSelectRow[]> {
  if (parentIds.length === 0) return [];
  const { data, error } = await client
    .from("feedback")
    .select(FEEDBACK_SELECT_COLUMNS)
    .in("parent_feedback_id", parentIds)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as FeedbackSelectRow[];
}

async function listFeedbackRowsByThreadId(
  client: SupabaseClientLike,
  threadId: string
): Promise<FeedbackSelectRow[]> {
  const { data, error } = await client
    .from("feedback")
    .select(FEEDBACK_SELECT_COLUMNS)
    .or(`id.eq.${threadId},parent_feedback_id.eq.${threadId}`)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as FeedbackSelectRow[];
}

async function listProfilesByIds(
  client: SupabaseClientLike,
  profileIds: string[]
): Promise<Map<string, ProfileSelectRow>> {
  const deduped = Array.from(new Set(profileIds.filter(Boolean)));
  const map = new Map<string, ProfileSelectRow>();
  if (deduped.length === 0) return map;

  const { data, error } = await client
    .from("profiles")
    .select("id,role,full_name,barangay_id,city_id,municipality_id")
    .in("id", deduped);

  if (error) {
    throw new Error(error.message);
  }

  for (const row of (data ?? []) as ProfileSelectRow[]) {
    map.set(row.id, row);
  }

  return map;
}

async function listScopeNameMapsByProfiles(
  client: SupabaseClientLike,
  profileById: Map<string, ProfileSelectRow>
): Promise<ScopeNameMaps> {
  const profiles = Array.from(profileById.values());
  const barangayIds = Array.from(
    new Set(
      profiles
        .map((profile) => profile.barangay_id)
        .filter((value): value is string => typeof value === "string" && value.length > 0)
    )
  );
  const cityIds = Array.from(
    new Set(
      profiles
        .map((profile) => profile.city_id)
        .filter((value): value is string => typeof value === "string" && value.length > 0)
    )
  );
  const municipalityIds = Array.from(
    new Set(
      profiles
        .map((profile) => profile.municipality_id)
        .filter((value): value is string => typeof value === "string" && value.length > 0)
    )
  );

  const [barangayResult, cityResult, municipalityResult] = await Promise.all([
    barangayIds.length
      ? client.from("barangays").select("id,name").in("id", barangayIds)
      : Promise.resolve({ data: [], error: null }),
    cityIds.length
      ? client.from("cities").select("id,name").in("id", cityIds)
      : Promise.resolve({ data: [], error: null }),
    municipalityIds.length
      ? client.from("municipalities").select("id,name").in("id", municipalityIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (barangayResult.error) throw new Error(barangayResult.error.message);
  if (cityResult.error) throw new Error(cityResult.error.message);
  if (municipalityResult.error) throw new Error(municipalityResult.error.message);

  return {
    barangayNameById: new Map(
      ((barangayResult.data ?? []) as Array<{ id: string; name: string }>).map((row) => [
        row.id,
        row.name,
      ])
    ),
    cityNameById: new Map(
      ((cityResult.data ?? []) as Array<{ id: string; name: string }>).map((row) => [
        row.id,
        row.name,
      ])
    ),
    municipalityNameById: new Map(
      ((municipalityResult.data ?? []) as Array<{ id: string; name: string }>).map((row) => [
        row.id,
        row.name,
      ])
    ),
  };
}

function toNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

async function maybeLogBarangayOfficialReplyActivity(
  client: SupabaseClientLike,
  inserted: FeedbackSelectRow
): Promise<void> {
  if (!inserted.parent_feedback_id || !inserted.author_id) return;
  if (typeof client.rpc !== "function") return;

  try {
    const profileById = await listProfilesByIds(client, [inserted.author_id]);
    const profile = profileById.get(inserted.author_id);
    if (!profile || profile.role !== "barangay_official") return;

    const actorName = toNonEmptyString(profile.full_name);
    const feedbackTargetLabel =
      inserted.target_type === "project" ? "project feedback thread" : "AIP feedback thread";
    const bodyPreview =
      inserted.body.length > 140 ? `${inserted.body.slice(0, 140)}...` : inserted.body;

    const { error } = await client.rpc("log_activity", {
      p_action: "comment_replied",
      p_entity_table: "feedback",
      p_entity_id: inserted.id,
      p_region_id: null,
      p_province_id: null,
      p_city_id: profile.city_id,
      p_municipality_id: profile.municipality_id,
      p_barangay_id: profile.barangay_id,
      p_metadata: withWorkflowActivityMetadata(
        {
          actor_name: actorName,
          actor_position: "Barangay Official",
          details: `Replied to a ${feedbackTargetLabel}.`,
          parent_feedback_id: inserted.parent_feedback_id,
          feedback_kind: inserted.kind,
          target_type: inserted.target_type,
          target_aip_id: inserted.aip_id,
          target_project_id: inserted.project_id,
          reply_preview: bodyPreview,
        },
        { hideCrudAction: "feedback_created" }
      ),
    });

    if (error) {
      console.error("[FEEDBACK] failed to log barangay official reply activity", {
        feedbackId: inserted.id,
        error: error.message,
      });
    }
  } catch (error) {
    console.error("[FEEDBACK] unexpected comment_replied logging failure", {
      feedbackId: inserted.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function getCurrentUserId(
  client: SupabaseClientLike
): Promise<string | null> {
  if (!client.auth) return null;
  const { data, error } = await client.auth.getUser();
  if (error) throw new Error(error.message);
  return data.user?.id ?? null;
}

async function resolveAuthorId(
  client: SupabaseClientLike,
  preferredAuthorId?: string | null
): Promise<string> {
  if (preferredAuthorId) return preferredAuthorId;
  const authId = await getCurrentUserId(client);
  if (!authId) {
    throw new Error("Unable to resolve feedback author.");
  }
  return authId;
}

function isOfficialRole(role: RoleType | null | undefined): boolean {
  return (
    role === "barangay_official" ||
    role === "city_official" ||
    role === "municipal_official"
  );
}

function hasOfficialReply(
  replies: FeedbackSelectRow[],
  profileById: Map<string, ProfileSelectRow>
): boolean {
  return replies.some((reply) => {
    if (!reply.author_id) return false;
    return isOfficialRole(profileById.get(reply.author_id)?.role);
  });
}

function toThreadPreviewStatus(officialReplyExists: boolean) {
  return officialReplyExists ? "responded" : "no_response";
}

async function getFeedbackRowById(
  client: SupabaseClientLike,
  feedbackId: string
): Promise<FeedbackSelectRow | null> {
  const { data, error } = await client
    .from("feedback")
    .select(FEEDBACK_SELECT_COLUMNS)
    .eq("id", feedbackId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as FeedbackSelectRow | null) ?? null;
}

function toThreadMessage(
  row: FeedbackSelectRow,
  profileById: Map<string, ProfileSelectRow>,
  threadId: string
): CommentMessage {
  const profile = row.author_id ? profileById.get(row.author_id) : null;
  return {
    id: row.id,
    threadId: row.parent_feedback_id ?? threadId,
    authorRole: toCommentAuthorRole(profile?.role),
    authorId: row.author_id ?? "system",
    kind: row.kind,
    text: row.body,
    createdAt: row.created_at,
  };
}

function toThread(
  root: FeedbackSelectRow,
  replies: FeedbackSelectRow[],
  profileById: Map<string, ProfileSelectRow>,
  scopeNameMaps: ScopeNameMaps
): CommentThread {
  const rootProfile = root.author_id ? profileById.get(root.author_id) : null;
  const role = toFeedbackAuthorDisplayRole(rootProfile?.role);
  const roleLabel = toFeedbackRoleLabel(role);
  const authorName = rootProfile?.full_name?.trim() || roleLabel;
  const authorLguLabel = buildFeedbackLguLabel({
    role: rootProfile?.role,
    barangayName: rootProfile?.barangay_id
      ? scopeNameMaps.barangayNameById.get(rootProfile.barangay_id)
      : null,
    cityName: rootProfile?.city_id ? scopeNameMaps.cityNameById.get(rootProfile.city_id) : null,
    municipalityName: rootProfile?.municipality_id
      ? scopeNameMaps.municipalityNameById.get(rootProfile.municipality_id)
      : null,
  });
  const latestRow = replies[replies.length - 1] ?? root;
  return {
    id: root.id,
    createdAt: root.created_at,
    createdByUserId: root.author_id ?? "system",
    target: toCommentTarget(root),
    preview: {
      text: root.body,
      updatedAt: latestRow.created_at,
      status: toThreadPreviewStatus(hasOfficialReply(replies, profileById)),
      kind: root.kind,
      authorName,
      authorRoleLabel: roleLabel,
      authorLguLabel,
      authorScopeLabel: authorLguLabel,
    },
  };
}

async function insertFeedbackRow(
  client: SupabaseClientLike,
  payload: {
    target_type: "aip" | "project";
    aip_id: string | null;
    project_id: string | null;
    parent_feedback_id: string | null;
    kind: FeedbackKind;
    body: string;
    author_id: string;
    is_public: boolean;
  }
): Promise<FeedbackSelectRow> {
  const rateLimit = await resolveCommentRateLimit(client);
  const recentCount = await countRecentFeedbackByAuthor(client, {
    authorId: payload.author_id,
    timeWindow: rateLimit.timeWindow,
  });
  if (recentCount >= rateLimit.maxComments) {
    throw new Error("Comment rate limit exceeded. Please try again later.");
  }

  const { data, error } = await client
    .from("feedback")
    .insert({
      target_type: payload.target_type,
      aip_id: payload.aip_id,
      project_id: payload.project_id,
      parent_feedback_id: payload.parent_feedback_id,
      source: "human",
      kind: payload.kind,
      extraction_run_id: null,
      extraction_artifact_id: null,
      field_key: null,
      severity: null,
      body: payload.body,
      is_public: payload.is_public,
      author_id: payload.author_id,
    })
    .select(FEEDBACK_SELECT_COLUMNS)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create feedback.");
  }

  const inserted = data as FeedbackSelectRow;
  await maybeLogBarangayOfficialReplyActivity(client, inserted);
  return inserted;
}

async function resolveCommentRateLimit(client: SupabaseClientLike): Promise<{
  maxComments: number;
  timeWindow: "hour" | "day";
}> {
  try {
    const { data, error } = await client
      .from("activity_log")
      .select("metadata,created_at")
      .eq("action", "comment_rate_limit_updated")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data || !data.metadata || typeof data.metadata !== "object") {
      return { maxComments: 5, timeWindow: "hour" };
    }

    const metadata = data.metadata as Record<string, unknown>;
    const maxCommentsRaw = metadata.max_comments;
    const timeWindowRaw = metadata.time_window;
    const maxComments =
      typeof maxCommentsRaw === "number" && Number.isFinite(maxCommentsRaw)
        ? Math.max(1, Math.floor(maxCommentsRaw))
        : 5;
    const timeWindow = timeWindowRaw === "day" ? "day" : "hour";

    return { maxComments, timeWindow };
  } catch {
    return { maxComments: 5, timeWindow: "hour" };
  }
}

async function countRecentFeedbackByAuthor(
  client: SupabaseClientLike,
  input: { authorId: string; timeWindow: "hour" | "day" }
): Promise<number> {
  const start = new Date();
  if (input.timeWindow === "day") {
    start.setHours(0, 0, 0, 0);
  } else {
    start.setTime(start.getTime() - 60 * 60 * 1000);
  }

  const { data, error } = await client
    .from("feedback")
    .select("id")
    .eq("author_id", input.authorId)
    .eq("source", "human")
    .gte("created_at", start.toISOString());

  if (error) {
    return 0;
  }

  return Array.isArray(data) ? data.length : 0;
}

function sanitizeFeedbackBody(body: string): string {
  const trimmed = body.trim();
  if (!trimmed) {
    throw new Error("Feedback body is required.");
  }
  return trimmed;
}

function buildFeedbackUpdatePatch(
  patch: Partial<Pick<FeedbackItem, "body" | "kind" | "isPublic">>
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (typeof patch.body === "string") payload.body = sanitizeFeedbackBody(patch.body);
  if (typeof patch.kind === "string") payload.kind = patch.kind;
  if (typeof patch.isPublic === "boolean") payload.is_public = patch.isPublic;
  return payload;
}

async function getAipScopeName(
  client: SupabaseClientLike,
  aip: AipLookupRow
): Promise<string | null> {
  if (aip.barangay_id) {
    const { data, error } = await client
      .from("barangays")
      .select("name")
      .eq("id", aip.barangay_id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return typeof data?.name === "string" ? data.name : null;
  }

  if (aip.city_id) {
    const { data, error } = await client
      .from("cities")
      .select("name")
      .eq("id", aip.city_id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return typeof data?.name === "string" ? data.name : null;
  }

  if (aip.municipality_id) {
    const { data, error } = await client
      .from("municipalities")
      .select("name")
      .eq("id", aip.municipality_id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return typeof data?.name === "string" ? data.name : null;
  }

  return null;
}

export function createCommentRepoFromClient(getClient: GetClient): CommentRepo {
  return {
    async listThreadsForInbox() {
      const client = await getClient();
      const { data, error } = await client
        .from("feedback")
        .select(FEEDBACK_SELECT_COLUMNS)
        .is("parent_feedback_id", null)
        .in("kind", [...CITIZEN_INITIATED_FEEDBACK_KINDS])
        .order("updated_at", { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      const roots = ((data ?? []) as FeedbackSelectRow[]).filter((row) =>
        isCitizenInitiatedFeedbackKind(row.kind)
      );
      const replies = await listFeedbackRowsByParentIds(
        client,
        roots.map((row) => row.id)
      );

      const repliesByParent = new Map<string, FeedbackSelectRow[]>();
      for (const row of replies) {
        if (!row.parent_feedback_id) continue;
        const list = repliesByParent.get(row.parent_feedback_id) ?? [];
        list.push(row);
        repliesByParent.set(row.parent_feedback_id, list);
      }

      const profileById = await listProfilesByIds(
        client,
        [
          ...roots.map((row) => row.author_id ?? ""),
          ...replies.map((row) => row.author_id ?? ""),
        ].filter(Boolean)
      );
      const scopeNameMaps = await listScopeNameMapsByProfiles(client, profileById);

      return roots
        .map((root) =>
          toThread(root, repliesByParent.get(root.id) ?? [], profileById, scopeNameMaps)
        )
        .sort(
          (left, right) =>
            new Date(right.preview.updatedAt).getTime() -
            new Date(left.preview.updatedAt).getTime()
        );
    },

    async getThread({ threadId }) {
      const client = await getClient();
      const root = await getFeedbackRowById(client, threadId);
      if (!root || root.parent_feedback_id) return null;

      const replies = await listFeedbackRowsByParentIds(client, [threadId]);
      const profileById = await listProfilesByIds(
        client,
        [
          root.author_id ?? "",
          ...replies.map((row) => row.author_id ?? ""),
        ].filter(Boolean)
      );
      const scopeNameMaps = await listScopeNameMapsByProfiles(client, profileById);

      return toThread(root, replies, profileById, scopeNameMaps);
    },

    async listMessages({ threadId }) {
      const client = await getClient();
      const rows = await listFeedbackRowsByThreadId(client, threadId);
      const profileById = await listProfilesByIds(
        client,
        rows.map((row) => row.author_id ?? "").filter(Boolean)
      );

      return rows.map((row) => toThreadMessage(row, profileById, threadId));
    },

    async addReply({ threadId, text }) {
      const client = await getClient();
      const parent = await getFeedbackRowById(client, threadId);
      if (!parent || parent.parent_feedback_id) {
        throw new Error("Thread not found.");
      }

      const authorId = await resolveAuthorId(client);
      const inserted = await insertFeedbackRow(client, {
        target_type: parent.target_type,
        aip_id: parent.target_type === "aip" ? parent.aip_id : null,
        project_id: parent.target_type === "project" ? parent.project_id : null,
        parent_feedback_id: parent.id,
        kind: "lgu_note",
        body: sanitizeFeedbackBody(text),
        author_id: authorId,
        is_public: true,
      });

      const profileById = await listProfilesByIds(client, [authorId]);
      return toThreadMessage(inserted, profileById, threadId);
    },

    async resolveThread() {
      return;
    },
  };
}

export function createFeedbackRepoFromClient(getClient: GetClient): FeedbackRepo {
  return {
    async listForAip(aipId) {
      const client = await getClient();
      const { data, error } = await client
        .from("feedback")
        .select(FEEDBACK_SELECT_COLUMNS)
        .eq("target_type", "aip")
        .eq("aip_id", aipId)
        .order("created_at", { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []).map((row: unknown) =>
        mapFeedbackRowToItem(row as FeedbackSelectRow)
      );
    },

    async listForProject(projectId) {
      const client = await getClient();
      const { data, error } = await client
        .from("feedback")
        .select(FEEDBACK_SELECT_COLUMNS)
        .eq("target_type", "project")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []).map((row: unknown) =>
        mapFeedbackRowToItem(row as FeedbackSelectRow)
      );
    },

    async createForAip(aipId, payload) {
      const client = await getClient();
      const authorId = await resolveAuthorId(client, payload.authorId ?? null);
      const inserted = await insertFeedbackRow(client, {
        target_type: "aip",
        aip_id: aipId,
        project_id: null,
        parent_feedback_id: null,
        kind: payload.kind,
        body: sanitizeFeedbackBody(payload.body),
        author_id: authorId,
        is_public: payload.isPublic ?? true,
      });
      return mapFeedbackRowToItem(inserted);
    },

    async createForProject(projectId, payload) {
      const client = await getClient();
      const authorId = await resolveAuthorId(client, payload.authorId ?? null);
      const inserted = await insertFeedbackRow(client, {
        target_type: "project",
        aip_id: null,
        project_id: projectId,
        parent_feedback_id: null,
        kind: payload.kind,
        body: sanitizeFeedbackBody(payload.body),
        author_id: authorId,
        is_public: payload.isPublic ?? true,
      });
      return mapFeedbackRowToItem(inserted);
    },

    async reply(parentFeedbackId, payload) {
      const client = await getClient();
      const parent = await getFeedbackRowById(client, parentFeedbackId);
      if (!parent) {
        throw new Error("Feedback parent not found.");
      }

      const authorId = await resolveAuthorId(client, payload.authorId ?? null);
      const inserted = await insertFeedbackRow(client, {
        target_type: parent.target_type,
        aip_id: parent.target_type === "aip" ? parent.aip_id : null,
        project_id: parent.target_type === "project" ? parent.project_id : null,
        parent_feedback_id: parent.id,
        kind: payload.kind,
        body: sanitizeFeedbackBody(payload.body),
        author_id: authorId,
        is_public: payload.isPublic ?? true,
      });

      return mapFeedbackRowToItem(inserted);
    },

    async update(feedbackId, patch) {
      const client = await getClient();
      const payload = buildFeedbackUpdatePatch(patch);
      if (Object.keys(payload).length === 0) {
        const existing = await getFeedbackRowById(client, feedbackId);
        return existing ? mapFeedbackRowToItem(existing) : null;
      }

      const { data, error } = await client
        .from("feedback")
        .update(payload)
        .eq("id", feedbackId)
        .select(FEEDBACK_SELECT_COLUMNS)
        .maybeSingle();

      if (error) throw new Error(error.message);
      if (!data) return null;

      return mapFeedbackRowToItem(data as FeedbackSelectRow);
    },

    async remove(feedbackId) {
      const client = await getClient();
      const { data, error } = await client
        .from("feedback")
        .delete()
        .eq("id", feedbackId)
        .select("id");

      if (error) throw new Error(error.message);
      return Array.isArray(data) && data.length > 0;
    },
  };
}

function toTargetFilterQuery(baseQuery: any, target: FeedbackTarget) {
  if (target.target_type === "project") {
    let query = baseQuery.eq("target_type", "project");
    if (target.project_id) query = query.eq("project_id", target.project_id);
    return query;
  }

  let query = baseQuery.eq("target_type", "aip");
  if (target.aip_id) query = query.eq("aip_id", target.aip_id);
  return query;
}

export function createFeedbackThreadsRepoFromClient(
  getClient: GetClient
): FeedbackThreadsRepo {
  return {
    async listThreadRootsByTarget(target) {
      const client = await getClient();
      const base = client
        .from("feedback")
        .select(FEEDBACK_SELECT_COLUMNS)
        .is("parent_feedback_id", null);
      const { data, error } = await toTargetFilterQuery(base, target).order(
        "created_at",
        { ascending: true }
      );
      if (error) throw new Error(error.message);
      return (data ?? []).map((row: unknown) =>
        mapFeedbackRowToThreadRow(row as FeedbackSelectRow)
      );
    },

    async listThreadMessages(rootId) {
      const client = await getClient();
      const rows = await listFeedbackRowsByThreadId(client, rootId);
      return rows.map(mapFeedbackRowToThreadRow);
    },

    async createRoot(input) {
      const client = await getClient();
      const inserted = await insertFeedbackRow(client, {
        target_type: input.target.target_type,
        aip_id: input.target.target_type === "aip" ? input.target.aip_id ?? null : null,
        project_id:
          input.target.target_type === "project"
            ? input.target.project_id ?? null
            : null,
        parent_feedback_id: null,
        kind: "question",
        body: sanitizeFeedbackBody(input.body),
        author_id: input.authorId,
        is_public: true,
      });
      return mapFeedbackRowToThreadRow(inserted);
    },

    async createReply(input) {
      const client = await getClient();
      const parent = await getFeedbackRowById(client, input.parentId);
      if (!parent) throw new Error("parent feedback not found");

      if (input.target) {
        const sameTarget =
          input.target.target_type === parent.target_type &&
          (input.target.aip_id ?? null) === (parent.aip_id ?? null) &&
          (input.target.project_id ?? null) === (parent.project_id ?? null);
        if (!sameTarget) throw new Error("reply feedback must match parent target");
      }

      const inserted = await insertFeedbackRow(client, {
        target_type: parent.target_type,
        aip_id: parent.target_type === "aip" ? parent.aip_id : null,
        project_id: parent.target_type === "project" ? parent.project_id : null,
        parent_feedback_id: parent.id,
        kind: "lgu_note",
        body: sanitizeFeedbackBody(input.body),
        author_id: input.authorId,
        is_public: true,
      });

      return mapFeedbackRowToThreadRow(inserted);
    },
  };
}

export function createCommentTargetLookupFromClient(
  getClient: GetClient
): CommentTargetLookup {
  return {
    async getProject(id) {
      const client = await getClient();
      let query = client
        .from("projects")
        .select(
          "id,aip_id,aip_ref_code,program_project_description,category,start_date,completion_date"
        )
        .limit(1);

      if (isUuid(id)) {
        query = query.or(`id.eq.${id},aip_ref_code.eq.${id}`);
      } else {
        query = query.eq("aip_ref_code", id);
      }

      const { data, error } = await query.maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) return null;

      const row = data as ProjectLookupRow;
      return {
        id: row.aip_ref_code || row.id,
        aipId: row.aip_id,
        title: row.program_project_description || "Project",
        year:
          getYearFromDateString(row.start_date) ??
          getYearFromDateString(row.completion_date),
        kind:
          row.category === "health"
            ? "health"
            : row.category === "infrastructure"
              ? "infrastructure"
              : row.category === "other"
                ? "other"
                : undefined,
      };
    },

    async getAip(id) {
      const client = await getClient();
      const { data, error } = await client
        .from("aips")
        .select("id,fiscal_year,barangay_id,city_id,municipality_id")
        .eq("id", id)
        .maybeSingle();

      if (error) throw new Error(error.message);
      if (!data) return null;

      const aip = data as AipLookupRow;
      const scopeName = await getAipScopeName(client, aip);
      return {
        id: aip.id,
        title: `AIP ${aip.fiscal_year}`,
        year: aip.fiscal_year,
        barangayName: scopeName,
      };
    },

    async getAipItem(aipId, aipItemId) {
      const client = await getClient();

      let query = client
        .from("projects")
        .select("id,aip_id,aip_ref_code,program_project_description")
        .eq("aip_id", aipId)
        .limit(1);

      if (isUuid(aipItemId)) {
        query = query.or(`id.eq.${aipItemId},aip_ref_code.eq.${aipItemId}`);
      } else {
        query = query.eq("aip_ref_code", aipItemId);
      }

      const { data, error } = await query.maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) return null;

      const row = data as ProjectLookupRow;
      return {
        id: row.id,
        aipId: row.aip_id,
        projectRefCode: row.aip_ref_code ?? undefined,
        aipDescription: row.program_project_description ?? "AIP Item",
      };
    },

    async findAipItemByProjectRefCode(projectRefCode) {
      const client = await getClient();
      const { data, error } = await client
        .from("projects")
        .select("id,aip_id,aip_ref_code,program_project_description")
        .eq("aip_ref_code", projectRefCode)
        .limit(1)
        .maybeSingle();

      if (error) throw new Error(error.message);
      if (!data) return null;

      const row = data as ProjectLookupRow;
      return {
        id: row.id,
        aipId: row.aip_id,
        projectRefCode: row.aip_ref_code ?? undefined,
        aipDescription: row.program_project_description ?? "AIP Item",
      };
    },
  };
}
