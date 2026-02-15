import { NextRequest, NextResponse } from "next/server";
import { getRunRecord } from "../../store";

type Params = { params: Promise<{ runId: string }> };

export async function GET(_: NextRequest, { params }: Params) {
  const { runId } = await params;
  const run = getRunRecord(runId);
  if (!run) {
    return NextResponse.json({ error: "Run not found" }, { status: 404 });
  }
  return NextResponse.json(run);
}
