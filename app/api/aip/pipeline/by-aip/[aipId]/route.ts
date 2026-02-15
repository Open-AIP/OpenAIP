import { NextRequest, NextResponse } from "next/server";
import { getRunByAip } from "../../store";

type Params = { params: Promise<{ aipId: string }> };

export async function GET(_: NextRequest, { params }: Params) {
  const { aipId } = await params;
  const run = getRunByAip(aipId);
  if (!run) {
    return NextResponse.json({ error: "Run not found" }, { status: 404 });
  }
  return NextResponse.json(run);
}
