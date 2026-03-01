import { supabaseServer } from "@/lib/supabase/server";
import {
  fail,
  mapSupabaseAuthErrorMessage,
  normalizeEmail,
  normalizePassword,
  ok,
} from "@/lib/auth/citizen-auth-route";
import { dbRoleToRouteRole } from "@/lib/auth/route-roles";
import {
  clearLoginAttemptState,
  getLoginAttemptStatus,
  recordLoginFailure,
} from "@/lib/security/login-attempts.server";
import { applySessionPolicyCookies } from "@/lib/security/session-cookies.server";
import { getSecuritySettings } from "@/lib/security/security-settings.server";

type StaffSignInBody = {
  email?: unknown;
  password?: unknown;
  role?: unknown;
};

function lockoutMessage(lockedUntil: string | null): string {
  if (!lockedUntil) return "Too many failed login attempts. Please try again later.";
  const minutes = Math.max(
    1,
    Math.ceil((new Date(lockedUntil).getTime() - Date.now()) / (60 * 1000))
  );
  return `Too many failed login attempts. Try again in ${minutes} minute(s).`;
}

function isStaffRole(value: unknown): value is "admin" | "city" | "barangay" {
  return value === "admin" || value === "city" || value === "barangay";
}

async function safeRecordFailure(email: string, settings: Awaited<ReturnType<typeof getSecuritySettings>>) {
  try {
    return await recordLoginFailure({ email, settings });
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as StaffSignInBody | null;
    const email = normalizeEmail(body?.email);
    const password = normalizePassword(body?.password);
    const role = body?.role;

    if (!email || !password || !isStaffRole(role)) {
      return fail("A valid role, email, and password are required.", 400);
    }

    const settings = await getSecuritySettings();
    const status = await getLoginAttemptStatus({ email }).catch(() => ({
      isLocked: false,
      failedCount: 0,
      lockedUntil: null,
    }));
    if (status.isLocked) {
      return fail(lockoutMessage(status.lockedUntil), 429);
    }

    const client = await supabaseServer();
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) {
      const nextStatus = await safeRecordFailure(email, settings);
      const message = nextStatus?.isLocked
        ? lockoutMessage(nextStatus.lockedUntil)
        : mapSupabaseAuthErrorMessage(error.message);
      return fail(message, nextStatus?.isLocked ? 429 : 401);
    }

    if (!data.user?.id) {
      await safeRecordFailure(email, settings);
      return fail("Sign-in failed. Please try again.", 401);
    }

    const { data: roleValue, error: roleError } = await client.rpc("current_role");
    if (roleError) {
      await client.auth.signOut();
      return fail(roleError.message, 500);
    }

    const resolvedRole = dbRoleToRouteRole(roleValue);
    if (!resolvedRole) {
      await client.auth.signOut();
      await safeRecordFailure(email, settings);
      return fail("Role Validation Failed.", 403);
    }
    if (resolvedRole !== role) {
      await client.auth.signOut();
      const nextStatus = await safeRecordFailure(email, settings);
      const message = nextStatus?.isLocked
        ? lockoutMessage(nextStatus.lockedUntil)
        : "Role Validation Failed.";
      return fail(message, nextStatus?.isLocked ? 429 : 403);
    }

    await clearLoginAttemptState({ email }).catch(() => undefined);

    const response = ok({ role: resolvedRole });
    applySessionPolicyCookies(response, settings);
    return response;
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to sign in.", 500);
  }
}
