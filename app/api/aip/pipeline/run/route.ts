import { NextResponse } from "next/server";
import { createRunRecord } from "../store";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const aipId = typeof body?.aipId === "string" ? body.aipId : "";
  if (!aipId) {
    return NextResponse.json({ error: "aipId is required" }, { status: 400 });
  }

  const run = createRunRecord(aipId);
  return NextResponse.json(run);
}
