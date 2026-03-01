import { NextResponse } from "next/server";
import {
  getSecuritySettings,
  toSecurityPolicyResponse,
} from "@/lib/security/security-settings.server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const settings = await getSecuritySettings();
    return NextResponse.json(toSecurityPolicyResponse(settings), {
      status: 200,
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load security policy.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

