import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import {
  assertPublishedProjectAip,
  CitizenFeedbackApiError,
  hydrateProjectFeedbackItems,
  listPublicProjectFeedback,
  requireCitizenActor,
  resolveProjectByIdOrRef,
  sanitizeCitizenFeedbackKind,
  sanitizeFeedbackBody,
  toErrorResponse,
} from "./_shared";

type CreateFeedbackRequestBody = {
  projectId?: string;
  kind?: unknown;
  body?: unknown;
};

const FEEDBACK_SELECT_COLUMNS =
  "id,target_type,project_id,parent_feedback_id,kind,body,author_id,is_public,created_at";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const rawProjectId = url.searchParams.get("projectId");
    if (!rawProjectId) {
      throw new CitizenFeedbackApiError(400, "Project ID is required.");
    }

    const client = await supabaseServer();
    const project = await resolveProjectByIdOrRef(client, rawProjectId);
    assertPublishedProjectAip(project.aipStatus);

    const items = await listPublicProjectFeedback(client, project.id);
    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error, "Failed to load project feedback.");
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json().catch(() => null)) as
      | CreateFeedbackRequestBody
      | null;

    const projectId = payload?.projectId?.trim();
    if (!projectId) {
      throw new CitizenFeedbackApiError(400, "Project ID is required.");
    }

    const kind = sanitizeCitizenFeedbackKind(payload?.kind);
    const body = sanitizeFeedbackBody(payload?.body);

    const client = await supabaseServer();
    const { userId } = await requireCitizenActor(client);
    const project = await resolveProjectByIdOrRef(client, projectId);
    assertPublishedProjectAip(project.aipStatus);

    const { data, error } = await client
      .from("feedback")
      .insert({
        target_type: "project",
        aip_id: null,
        project_id: project.id,
        parent_feedback_id: null,
        source: "human",
        kind,
        extraction_run_id: null,
        extraction_artifact_id: null,
        field_key: null,
        severity: null,
        body,
        is_public: true,
        author_id: userId,
      })
      .select(FEEDBACK_SELECT_COLUMNS)
      .single();

    if (error || !data) {
      throw new CitizenFeedbackApiError(500, error?.message ?? "Failed to create feedback.");
    }

    const [item] = await hydrateProjectFeedbackItems([data]);
    if (!item) {
      throw new CitizenFeedbackApiError(500, "Failed to load created feedback.");
    }

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error, "Failed to create project feedback.");
  }
}
