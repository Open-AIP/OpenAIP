import type { Json, RoleType } from "@/lib/contracts/databasev2";
import type {
  RetrievalFiltersPayload,
  RetrievalScopePayload,
  RetrievalScopeTarget,
} from "@/lib/chat/types";
import { requestPipelineChatAnswer } from "@/lib/chat/pipeline-client";
import { getTypedAppSetting, isUserBlocked } from "@/lib/settings/app-settings";
import { enforceCsrfProtection } from "@/lib/security/csrf";
import { assertPrivilegedWriteAccess, isInvariantError } from "@/lib/security/invariants";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  consumeChatQuota,
  insertAssistantChatMessage,
  toPrivilegedActorContextFromProfile,
} from "@/lib/supabase/privileged-ops";
import { supabaseServer } from "@/lib/supabase/server";
import { isCitizenProfileComplete } from "@/lib/auth/citizen-profile-completion";
import { NextResponse } from "next/server";

type ReplyRequestBody = {
  session_id?: string;
  user_message?: string;
};

type ChatSessionRow = {
  id: string;
  title: string | null;
  context: Json;
};

type ChatMessageRow = {
  id: string;
  session_id: string;
  role: "assistant" | "system" | "user";
  content: string;
  citations: Json | null;
  retrieval_meta: Json | null;
  created_at: string;
};

type ProfileScopeRow = {
  id: string;
  role: RoleType;
  full_name: string | null;
  barangay_id: string | null;
  city_id: string | null;
  municipality_id: string | null;
};

type ChatQuotaResult = {
  allowed: boolean;
  reason: string;
};

type DbCitation = {
  id: string;
  documentLabel: string;
  snippet: string;
  fiscalYear: string | null;
  pageOrSection: string | null;
  projectRefCode: string | null;
};

const MESSAGE_CONTENT_LIMIT = 12000;
const RETRIEVAL_FILTER_YEAR_PATTERN = /\b(20\d{2})\b/g;
const RETRIEVAL_FILTER_MULTI_YEAR_CUE_PATTERN =
  /\b(compare|comparison|trend|across|between|vs|versus|from\s+20\d{2}\s+to\s+20\d{2})\b/i;

function normalizePipelineReason(value: unknown):
  | "ok"
  | "insufficient_evidence"
  | "partial_evidence"
  | "verifier_failed"
  | "ambiguous_scope"
  | "pipeline_error"
  | "validation_failed"
  | "unknown" {
  if (
    value === "ok" ||
    value === "insufficient_evidence" ||
    value === "partial_evidence" ||
    value === "verifier_failed" ||
    value === "ambiguous_scope" ||
    value === "pipeline_error" ||
    value === "validation_failed" ||
    value === "unknown"
  ) {
    return value;
  }
  return "unknown";
}

function buildRefusalMessage(reason: "pipeline_error" | "validation_failed" | "insufficient_evidence"): string {
  if (reason === "pipeline_error") {
    return "I couldn't complete retrieval due to a temporary system issue. Please try again in a few moments.";
  }
  if (reason === "validation_failed") {
    return "I can't provide a grounded answer from retrieval for that request. Please include clearer scope or fiscal-year details and try again.";
  }
  return "I couldn't find enough relevant retrieved evidence to answer reliably.";
}

function normalizeSuggestedFollowUps(source: unknown): string[] {
  if (!Array.isArray(source)) {
    return [];
  }
  return source
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0)
    .slice(0, 3);
}

function makeSystemDbCitation(snippet: string, metadata?: Record<string, unknown>): DbCitation {
  return {
    id: "system_1",
    documentLabel: "System",
    snippet,
    fiscalYear: null,
    pageOrSection: null,
    projectRefCode: null,
    ...(metadata ? { metadata } : {}),
  } as DbCitation;
}

async function resolveScopeName(
  admin: ReturnType<typeof supabaseAdmin>,
  target: RetrievalScopeTarget
): Promise<string | null> {
  const table =
    target.scope_type === "barangay"
      ? "barangays"
      : target.scope_type === "city"
        ? "cities"
        : "municipalities";

  const { data, error } = await admin
    .from(table)
    .select("name")
    .eq("id", target.scope_id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return typeof data?.name === "string" ? data.name : null;
}

async function buildRetrievalScope(input: {
  profile: ProfileScopeRow;
  admin: ReturnType<typeof supabaseAdmin>;
}): Promise<RetrievalScopePayload> {
  const targets: RetrievalScopeTarget[] = [];

  if (input.profile.barangay_id) {
    targets.push({
      scope_type: "barangay",
      scope_id: input.profile.barangay_id,
      scope_name: "",
    });
  } else if (input.profile.city_id) {
    targets.push({
      scope_type: "city",
      scope_id: input.profile.city_id,
      scope_name: "",
    });
  } else if (input.profile.municipality_id) {
    targets.push({
      scope_type: "municipality",
      scope_id: input.profile.municipality_id,
      scope_name: "",
    });
  }

  if (targets.length === 0) {
    return {
      mode: "global",
      targets: [],
    };
  }

  const withNames = await Promise.all(
    targets.map(async (target) => ({
      ...target,
      scope_name: (await resolveScopeName(input.admin, target)) ?? target.scope_type,
    }))
  );

  return {
    mode: input.profile.role === "citizen" ? "own_barangay" : "named_scopes",
    targets: withNames,
  };
}

function deriveSingleFiscalYearFilter(message: string): number | undefined {
  const parsedYears = Array.from(message.matchAll(RETRIEVAL_FILTER_YEAR_PATTERN))
    .map((match) => Number.parseInt(match[1] ?? "", 10))
    .filter((year) => Number.isInteger(year));
  const uniqueYears = Array.from(new Set(parsedYears));
  if (uniqueYears.length !== 1) {
    return undefined;
  }
  if (RETRIEVAL_FILTER_MULTI_YEAR_CUE_PATTERN.test(message)) {
    return undefined;
  }
  return uniqueYears[0];
}

function detectDocumentTypeFromText(message: string): string | undefined {
  const normalized = message.toLowerCase();
  if (normalized.includes("baip")) return "BAIP";
  if (normalized.includes("aip")) return "AIP";
  return undefined;
}

function buildRetrievalFilters(input: {
  message: string;
  retrievalScope: RetrievalScopePayload;
}): RetrievalFiltersPayload {
  const filters: RetrievalFiltersPayload = {
    publication_status: "published",
  };

  const fiscalYear = deriveSingleFiscalYearFilter(input.message);
  if (typeof fiscalYear === "number") {
    filters.fiscal_year = fiscalYear;
  }

  const docType = detectDocumentTypeFromText(input.message);
  if (docType) {
    filters.document_type = docType;
  }

  if (input.retrievalScope.targets.length === 1) {
    const target = input.retrievalScope.targets[0];
    filters.scope_type = target.scope_type;
    filters.scope_name = target.scope_name;
  }

  return filters;
}

function toDbCitations(payload: {
  citations: Array<{
    source_id: string;
    snippet: string;
    fiscal_year?: number | null;
    scope_name?: string | null;
    source_page?: number | null;
    project_ref_code?: string | null;
    metadata?: unknown;
  }>;
}): Json {
  return payload.citations.map((citation, index) => {
    const metadata =
      citation.metadata && typeof citation.metadata === "object" && !Array.isArray(citation.metadata)
        ? (citation.metadata as Record<string, unknown>)
        : {};

    return {
      id: citation.source_id || `evidence_${index + 1}`,
      documentLabel:
        typeof metadata.document_label === "string"
          ? metadata.document_label
          : citation.scope_name || "Published AIP",
      snippet: citation.snippet,
      fiscalYear:
        typeof citation.fiscal_year === "number"
          ? String(citation.fiscal_year)
          : null,
      pageOrSection:
        typeof metadata.page_no === "number"
          ? `Page ${metadata.page_no}`
          : typeof citation.source_page === "number"
            ? `Page ${citation.source_page}`
            : typeof metadata.section === "string"
              ? metadata.section
              : null,
      projectRefCode:
        typeof metadata.project_ref_code === "string"
          ? metadata.project_ref_code
          : citation.project_ref_code ?? null,
    };
  }) as Json;
}

async function consumeCitizenQuota(input: {
  actor: NonNullable<ReturnType<typeof toPrivilegedActorContextFromProfile>>;
  userId: string;
  maxRequests: number;
  timeWindow: "per_hour" | "per_day";
}): Promise<ChatQuotaResult> {
  const quota = await consumeChatQuota({
    actor: input.actor,
    userId: input.userId,
    maxRequests: input.maxRequests,
    timeWindow: input.timeWindow,
    route: "citizen_chat_reply",
  });
  return {
    allowed: quota.allowed,
    reason: quota.reason,
  };
}

export async function POST(request: Request) {
  try {
    const csrf = enforceCsrfProtection(request);
    if (!csrf.ok) {
      return csrf.response;
    }

    const body = (await request.json().catch(() => null)) as ReplyRequestBody | null;
    const sessionId = body?.session_id?.trim();
    const userMessage = body?.user_message?.trim();

    if (!sessionId || !userMessage) {
      return NextResponse.json(
        { error: "Missing required fields: session_id, user_message" },
        { status: 400 }
      );
    }

    if (userMessage.length > MESSAGE_CONTENT_LIMIT) {
      return NextResponse.json(
        { error: `Message exceeds ${MESSAGE_CONTENT_LIMIT} characters.` },
        { status: 400 }
      );
    }

    const server = await supabaseServer();
    const { data: authData, error: authError } = await server.auth.getUser();
    if (authError || !authData.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = authData.user.id;

    if (await isUserBlocked(userId)) {
      return NextResponse.json(
        { error: "Your account is currently blocked from chatbot usage." },
        { status: 403 }
      );
    }

    const { data: sessionData, error: sessionError } = await server
      .from("chat_sessions")
      .select("id,title,context")
      .eq("id", sessionId)
      .eq("user_id", userId)
      .maybeSingle();

    if (sessionError) {
      return NextResponse.json({ error: sessionError.message }, { status: 400 });
    }

    if (!sessionData) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const session = sessionData as ChatSessionRow;

    const { data: profileData, error: profileError } = await server
      .from("profiles")
      .select("id,role,full_name,barangay_id,city_id,municipality_id")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    if (!profileData) {
      return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    }

    const profile = profileData as ProfileScopeRow;
    if (profile.role !== "citizen") {
      return NextResponse.json({ error: "Only citizens can use this endpoint." }, { status: 403 });
    }
    if (!isCitizenProfileComplete(profile)) {
      return NextResponse.json(
        { error: "Complete your profile before using the AI Assistant." },
        { status: 403 }
      );
    }

    const privilegedActor = toPrivilegedActorContextFromProfile({
      userId,
      role: profile.role,
      barangayId: profile.barangay_id,
      cityId: profile.city_id,
      municipalityId: profile.municipality_id,
    });
    if (!privilegedActor) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    assertPrivilegedWriteAccess({
      actor: privilegedActor,
      allowlistedRoles: ["citizen"],
      scopeByRole: { citizen: "barangay" },
      requireScopeId: true,
      message: "Unauthorized",
    });

    const rateLimitPolicy = await getTypedAppSetting("controls.chatbot_rate_limit");
    const quota = await consumeCitizenQuota({
      actor: privilegedActor,
      userId,
      maxRequests: rateLimitPolicy.maxRequests,
      timeWindow: rateLimitPolicy.timeWindow,
    });
    if (!quota.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again shortly.", reason: quota.reason },
        { status: 429 }
      );
    }

    const admin = supabaseAdmin();
    const retrievalScope = await buildRetrievalScope({
      profile,
      admin,
    });

    let answerContent = "";
    let refused = false;
    let reason: ReturnType<typeof normalizePipelineReason> = "unknown";
    let dbCitations: Json = [];
    let retrievalMeta: Json = {};
    let suggestedFollowUps: string[] = [];

    try {
      const pipeline = await requestPipelineChatAnswer({
        question: userMessage,
        retrievalScope,
        retrievalMode: "qa",
        retrievalFilters: buildRetrievalFilters({
          message: userMessage,
          retrievalScope,
        }),
        topK: 5,
      });

      reason = normalizePipelineReason(pipeline.retrieval_meta?.reason);
      refused = Boolean(pipeline.refused);
      answerContent = pipeline.answer.trim();

      const pipelineCitations = pipeline.citations
        .map((citation) => ({
          source_id: citation.source_id,
          snippet: citation.snippet,
          fiscal_year: citation.fiscal_year ?? null,
          scope_name: citation.scope_name ?? null,
          source_page: citation.source_page ?? null,
          project_ref_code: citation.project_ref_code ?? null,
          metadata: citation.metadata,
        }))
        .filter((citation) => citation.snippet.trim().length > 0);

      if (!answerContent) {
        refused = true;
        reason = "validation_failed";
        answerContent = buildRefusalMessage("validation_failed");
      }

      if (pipelineCitations.length === 0) {
        refused = true;
        if (reason === "ok") {
          reason = "validation_failed";
        }
        dbCitations = [
          makeSystemDbCitation("No retrieval citations were produced for this response.", {
            reason: "missing_citations",
          }),
        ] as unknown as Json;
        answerContent = buildRefusalMessage(
          reason === "pipeline_error" ? "pipeline_error" : "validation_failed"
        );
      } else {
        dbCitations = toDbCitations({
          citations: pipelineCitations,
        });
      }

      suggestedFollowUps = normalizeSuggestedFollowUps(
        (pipeline.retrieval_meta as Record<string, unknown> | undefined)?.suggested_follow_ups ??
          (pipeline.retrieval_meta as Record<string, unknown> | undefined)?.suggestedFollowUps
      );

      retrievalMeta = {
        ...(pipeline.retrieval_meta ?? {}),
        refused,
        reason,
        status: refused ? "refusal" : "answer",
        source: "pipeline_chat_answer",
        sessionTitle: session.title,
        context: session.context,
        suggestedFollowUps,
      } as Json;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Pipeline chat request failed.";
      refused = true;
      reason = "pipeline_error";
      answerContent = buildRefusalMessage("pipeline_error");
      dbCitations = [
        makeSystemDbCitation("Pipeline chat request failed.", {
          reason: "pipeline_error",
          error: message,
        }),
      ] as unknown as Json;
      retrievalMeta = {
        refused: true,
        reason: "pipeline_error",
        status: "refusal",
        source: "pipeline_chat_answer",
        sessionTitle: session.title,
        context: session.context,
        suggestedFollowUps: [],
      } as Json;
      suggestedFollowUps = [];
    }

    if (!answerContent.trim()) {
      refused = true;
      reason = "validation_failed";
      answerContent = buildRefusalMessage("validation_failed");
      dbCitations = [
        makeSystemDbCitation("Assistant response was empty after retrieval.", {
          reason: "validation_failed",
        }),
      ] as unknown as Json;
      retrievalMeta = {
        ...(retrievalMeta as Record<string, unknown>),
        refused: true,
        reason,
        status: "refusal",
      } as Json;
    }

    const inserted = (await insertAssistantChatMessage({
      actor: privilegedActor,
      sessionId,
      content: answerContent,
      citations: dbCitations,
      retrievalMeta,
    })) as ChatMessageRow;

    return NextResponse.json({
      message: {
        id: inserted.id,
        sessionId: inserted.session_id,
        role: inserted.role,
        content: inserted.content,
        citations: inserted.citations,
        retrievalMeta: inserted.retrieval_meta,
        createdAt: inserted.created_at,
      },
      suggestedFollowUps,
    });
  } catch (error) {
    if (isInvariantError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
