import { NextResponse } from "next/server";
import { getActorContext } from "@/lib/domain/get-actor-context";
import { monitorSecurityPolicyRead } from "@/lib/security/login-attempts.server";
import {
  getSecuritySettings,
  type SecurityPolicyResponse,
  toPublicSecurityPolicyResponse,
  toSecurityPolicyResponse,
} from "@/lib/security/security-settings.server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const [settings, actor] = await Promise.all([getSecuritySettings(), getActorContext()]);
    const audience = !actor ? "anon" : actor.role === "citizen" ? "citizen" : "staff";

    try {
      monitorSecurityPolicyRead({ request, audience });
    } catch {
      // Best-effort monitoring only.
    }

    const payload: SecurityPolicyResponse =
      audience === "staff"
        ? toSecurityPolicyResponse(settings)
        : toPublicSecurityPolicyResponse(settings);

    return NextResponse.json(payload, {
      status: 200,
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load security policy.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
