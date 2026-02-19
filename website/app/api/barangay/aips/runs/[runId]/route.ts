import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ runId: string }> }
) {
  try {
    const { runId } = await context.params;
    const client = await supabaseServer();

    const { data, error } = await client
      .from("extraction_runs")
      .select(
        "id,aip_id,uploaded_file_id,stage,status,error_code,error_message,started_at,finished_at,created_at"
      )
      .eq("id", runId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    if (!data) {
      return NextResponse.json({ message: "Run not found." }, { status: 404 });
    }

    return NextResponse.json(
      {
        runId: data.id,
        aipId: data.aip_id,
        uploadedFileId: data.uploaded_file_id,
        stage: data.stage,
        status: data.status,
        errorCode: data.error_code,
        errorMessage: data.error_message,
        startedAt: data.started_at,
        finishedAt: data.finished_at,
        createdAt: data.created_at,
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected run status error.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
