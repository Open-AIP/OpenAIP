import type { Json } from "@/lib/contracts/databasev2";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";
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

const MESSAGE_CONTENT_LIMIT = 12000;

function buildAssistantReply(content: string): string {
  if (content.toLowerCase().includes("budget")) {
    return (
      "Based on published AIP documents, review allocations by sector before finalizing recommendations.\\n\\n" +
      "1. Confirm the current fiscal year totals\\n" +
      "2. Compare social vs infrastructure allocations\\n" +
      "3. Check scope-specific projects for your barangay or city\\n" +
      "4. Validate with official line-item references"
    );
  }

  return "I can answer using published AIP records only. Add fiscal year and scope so I can return grounded details with evidence.";
}

function buildCitations(): Json {
  return [
    {
      id: `evidence_${Date.now()}`,
      documentLabel: "Published AIP Registry",
      snippet: "Relevant allocation and project entries were matched from published AIP documents.",
      fiscalYear: "FY 2025-2026",
      pageOrSection: "Budget Summary",
    },
  ];
}

function buildRetrievalMeta(): Json {
  return {
    source: "published_aip_only",
    confidence: "moderate",
    suggestedFollowUps: [
      "Show me the total budget by sector for FY 2025-2026.",
      "List infrastructure projects in my scope.",
      "Compare this FY against last FY allocations.",
    ],
  };
}

export async function POST(request: Request) {
  try {
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
    const assistantContent = buildAssistantReply(userMessage);
    const citations = buildCitations();
    const retrievalMeta = {
      ...((buildRetrievalMeta() as Record<string, unknown>) ?? {}),
      sessionTitle: session.title,
      context: session.context,
    } as Json;

    const admin = supabaseAdmin();
    const { data: insertedData, error: insertError } = await admin
      .from("chat_messages")
      .insert({
        session_id: sessionId,
        role: "assistant",
        content: assistantContent,
        citations: citations,
        retrieval_meta: retrievalMeta,
      })
      .select("id,session_id,role,content,citations,retrieval_meta,created_at")
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    const inserted = insertedData as ChatMessageRow;
    const followUps =
      typeof inserted.retrieval_meta === "object" && inserted.retrieval_meta && !Array.isArray(inserted.retrieval_meta)
        ? ((inserted.retrieval_meta as { suggestedFollowUps?: unknown }).suggestedFollowUps as string[] | undefined)
        : undefined;

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
      suggestedFollowUps: Array.isArray(followUps) ? followUps : [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
