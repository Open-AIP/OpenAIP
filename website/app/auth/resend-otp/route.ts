import { supabaseServer } from "@/lib/supabase/server";
import {
  fail,
  mapSupabaseAuthErrorMessage,
  normalizeEmail,
  ok,
  toSiteUrl,
} from "@/lib/auth/citizen-auth-route";

type ResendOtpRequestBody = {
  email?: unknown;
};

export async function POST(request: Request) {
  try {
    const payload = (await request.json().catch(() => null)) as ResendOtpRequestBody | null;
    const email = normalizeEmail(payload?.email);

    if (!email) {
      return fail("A valid email is required.", 400);
    }

    const client = await supabaseServer();
    const { error } = await client.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${toSiteUrl(request)}/confirm`,
      },
    });

    if (error) {
      return fail(mapSupabaseAuthErrorMessage(error.message), 400);
    }

    return ok({
      message: "A new code has been sent.",
    });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to resend OTP.", 500);
  }
}
