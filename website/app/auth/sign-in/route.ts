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

type SignInRequestBody = {
  email?: unknown;
  password?: unknown;
};

export async function POST(request: Request) {
  try {
    const payload = (await request.json().catch(() => null)) as SignInRequestBody | null;
    const email = normalizeEmail(payload?.email);
    const password = normalizePassword(payload?.password);

    if (!email || !password) {
      return fail("A valid email and password are required.", 400);
    }

    const client = await supabaseServer();
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return fail(mapSupabaseAuthErrorMessage(error.message), 401);
    }

    const userId = data.user?.id;
    if (!userId) {
      return fail("Sign-in failed. Please try again.", 401);
    }

    const { data: roleValue, error: roleError } = await client.rpc("current_role");
    if (roleError) {
      await client.auth.signOut();
      return fail(roleError.message, 500);
    }
    if (typeof roleValue === "string" && roleValue !== "citizen") {
      await client.auth.signOut();
      return fail("This sign-in form is only for citizens.", 403);
    }

    const profile = await getCitizenProfileByUserId(client, userId);
    if (profile && profile.role !== "citizen") {
      await client.auth.signOut();
      return fail("This sign-in form is only for citizens.", 403);
    }

    return ok({
      next: isCitizenProfileComplete(profile) ? "redirect" : "complete_profile",
    });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to sign in.", 500);
  }
}
