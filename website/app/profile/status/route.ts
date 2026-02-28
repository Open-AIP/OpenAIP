import { supabaseServer } from "@/lib/supabase/server";
import { fail, ok } from "@/lib/auth/citizen-auth-route";
import {
  getCitizenProfileByUserId,
  isCitizenProfileComplete,
} from "@/lib/auth/citizen-profile-completion";

export async function GET() {
  try {
    const client = await supabaseServer();
    const { data: authData, error: authError } = await client.auth.getUser();
    if (authError || !authData.user?.id) {
      return fail("Authentication required.", 401);
    }

    const profile = await getCitizenProfileByUserId(client, authData.user.id);
    if (profile && profile.role !== "citizen") {
      return fail("This endpoint is only for citizen accounts.", 403);
    }

    return ok({
      isComplete: isCitizenProfileComplete(profile),
    });
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Unable to load profile status.",
      500
    );
  }
}
