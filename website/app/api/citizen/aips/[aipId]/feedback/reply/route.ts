import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import {
  assertPublishedAipStatus,
  CitizenAipFeedbackApiError,
  hydrateAipFeedbackItems,
  loadAipFeedbackRowById,
  requireCitizenActor,
  resolveAipById,
  sanitizeCitizenFeedbackKind,
  sanitizeFeedbackBody,
  toErrorResponse,
} from "../../../_feedback-shared";

type ReplyFeedbackRequestBody = {
  parentFeedbackId?: string;
  kind?: unknown;
  body?: unknown;
};

const FEEDBACK_SELECT_COLUMNS =
  "id,target_type,aip_id,parent_feedback_id,kind,body,author_id,is_public,created_at";

export async function POST(
  request: Request,
  context: { params: Promise<{ aipId: string }> }
) {
  try {
    const payload = (await request.json().catch(() => null)) as
      | ReplyFeedbackRequestBody
      | null;

    const parentFeedbackId = payload?.parentFeedbackId?.trim();
    if (!parentFeedbackId) {
      throw new CitizenAipFeedbackApiError(400, "Parent feedback ID is required.");
    }

    const kind = sanitizeCitizenFeedbackKind(payload?.kind);
    const body = sanitizeFeedbackBody(payload?.body);

    const { aipId } = await context.params;
    const client = await supabaseServer();
    const { userId } = await requireCitizenActor(client);
    const aip = await resolveAipById(client, aipId);
    assertPublishedAipStatus(aip.status);

    const parent = await loadAipFeedbackRowById(client, parentFeedbackId);
    if (!parent) {
      throw new CitizenAipFeedbackApiError(404, "Parent feedback not found.");
    }

    if (parent.target_type !== "aip" || !parent.aip_id) {
      throw new CitizenAipFeedbackApiError(400, "Parent feedback target must be an AIP.");
    }

    if (parent.aip_id !== aip.id) {
      throw new CitizenAipFeedbackApiError(
        400,
        "Parent feedback does not belong to the selected AIP."
      );
    }

    const rootFeedbackId = parent.parent_feedback_id ?? parent.id;
    const { data, error } = await client
      .from("feedback")
      .insert({
        target_type: "aip",
        aip_id: aip.id,
        project_id: null,
        parent_feedback_id: rootFeedbackId,
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
      throw new CitizenAipFeedbackApiError(500, error?.message ?? "Failed to create feedback reply.");
    }

    const [item] = await hydrateAipFeedbackItems([data]);
    if (!item) {
      throw new CitizenAipFeedbackApiError(500, "Failed to load created feedback reply.");
    }

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error, "Failed to create AIP feedback reply.");
  }
}
