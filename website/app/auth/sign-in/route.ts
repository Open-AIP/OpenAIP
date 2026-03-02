import { supabaseServer } from "@/lib/supabase/server";
import {
  fail,
  mapSupabaseAuthErrorMessage,
  normalizeEmail,
  normalizePassword,
  ok,
} from "@/lib/auth/citizen-auth-route";
import {
  getCitizenProfileByUserId,
  isCitizenProfileComplete,
} from "@/lib/auth/citizen-profile-completion";
import {
  clearLoginAttemptState,
  getLoginAttemptStatus,
  recordLoginFailure,
} from "@/lib/security/login-attempts.server";
import { applySessionPolicyCookies } from "@/lib/security/session-cookies.server";
import { getSecuritySettings } from "@/lib/security/security-settings.server";

type SignInRequestBody = {
  email?: unknown;
  password?: unknown;
};

function lockoutMessage(lockedUntil: string | null): string {
  if (!lockedUntil) return "Too many failed login attempts. Please try again later.";
  const minutes = Math.max(
    1,
    Math.ceil((new Date(lockedUntil).getTime() - Date.now()) / (60 * 1000))
  );
  return `Too many failed login attempts. Try again in ${minutes} minute(s).`;
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
    const payload = (await request.json().catch(() => null)) as SignInRequestBody | null;
    const email = normalizeEmail(payload?.email);
    const password = normalizePassword(payload?.password);

    if (!email || !password) {
      return fail("A valid email and password are required.", 400);
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
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      const nextStatus = await safeRecordFailure(email, settings);
      const message = nextStatus?.isLocked
        ? lockoutMessage(nextStatus.lockedUntil)
        : mapSupabaseAuthErrorMessage(error.message);
      return fail(message, nextStatus?.isLocked ? 429 : 401);
    }

    const userId = data.user?.id;
    if (!userId) {
      await safeRecordFailure(email, settings);
      return fail("Sign-in failed. Please try again.", 401);
    }

    const { data: roleValue, error: roleError } = await client.rpc("current_role");
    if (roleError) {
      await client.auth.signOut();
      return fail(roleError.message, 500);
    }
    if (typeof roleValue === "string" && roleValue !== "citizen") {
      await client.auth.signOut();
      const nextStatus = await safeRecordFailure(email, settings);
      const message = nextStatus?.isLocked
        ? lockoutMessage(nextStatus.lockedUntil)
        : "This sign-in form is only for citizens.";
      return fail(message, nextStatus?.isLocked ? 429 : 403);
    }

    const profile = await getCitizenProfileByUserId(client, userId);
    if (profile && profile.role !== "citizen") {
      await client.auth.signOut();
      const nextStatus = await safeRecordFailure(email, settings);
      const message = nextStatus?.isLocked
        ? lockoutMessage(nextStatus.lockedUntil)
        : "This sign-in form is only for citizens.";
      return fail(message, nextStatus?.isLocked ? 429 : 403);
    }

    await clearLoginAttemptState({ email }).catch(() => undefined);

    const response = ok({
      next: isCitizenProfileComplete(profile) ? "redirect" : "complete_profile",
    });
    applySessionPolicyCookies(response, settings);
    return response;
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to sign in.", 500);
  }
}

