import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";
import { getActorContext } from "@/lib/domain/get-actor-context";

export async function POST(
  _request: Request,
  context: { params: Promise<{ runId: string }> }
) {
  try {
    const actor = await getActorContext();
    if (!actor) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const { runId } = await context.params;
    const client = await supabaseServer();

    const { data: run, error: runError } = await client
      .from("extraction_runs")
      .select("id,aip_id,uploaded_file_id,status")
      .eq("id", runId)
      .maybeSingle();

    if (runError) {
      return NextResponse.json({ message: runError.message }, { status: 400 });
    }
    if (!run) {
      return NextResponse.json({ message: "Run not found." }, { status: 404 });
    }
    if (run.status !== "failed") {
      return NextResponse.json({ message: "Only failed runs can be retried." }, { status: 409 });
    }

    const { data: canEdit, error: canEditError } = await client.rpc("can_edit_aip", {
      p_aip_id: run.aip_id,
    });
    if (canEditError) {
      return NextResponse.json({ message: canEditError.message }, { status: 400 });
    }
    if (!canEdit) {
      return NextResponse.json({ message: "You cannot retry this run." }, { status: 403 });
    }

    const admin = supabaseAdmin();
    const { data: newRun, error: newRunError } = await admin
      .from("extraction_runs")
      .insert({
        aip_id: run.aip_id,
        uploaded_file_id: run.uploaded_file_id,
        stage: "extract",
        status: "queued",
        model_name: "gpt-5.2",
        created_by: actor.userId,
      })
      .select("id,status")
      .single();

    if (newRunError || !newRun) {
      return NextResponse.json(
        { message: newRunError?.message ?? "Failed to create retry run." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        runId: newRun.id,
        status: newRun.status,
        aipId: run.aip_id,
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected retry error.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
