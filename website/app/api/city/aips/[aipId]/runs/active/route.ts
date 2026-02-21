import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ aipId: string }> }
) {
  try {
    const { aipId } = await context.params;
    const client = await supabaseServer();

    const { data, error } = await client
      .from("extraction_runs")
      .select("id,aip_id,stage,status,error_message,created_at")
      .eq("aip_id", aipId)
      .in("status", ["queued", "running"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    if (!data) {
      return NextResponse.json({ run: null }, { status: 200 });
    }

    return NextResponse.json(
      {
        run: {
          runId: data.id,
          aipId: data.aip_id,
          stage: data.stage,
          status: data.status,
          errorMessage: data.error_message,
          createdAt: data.created_at,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected active run lookup error.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
