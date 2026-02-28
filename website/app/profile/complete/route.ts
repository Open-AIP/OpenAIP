import { supabaseServer } from "@/lib/supabase/server";
import { fail, ok } from "@/lib/auth/citizen-auth-route";
import {
  getCitizenProfileByUserId,
  resolveCitizenBarangayByNames,
} from "@/lib/auth/citizen-profile-completion";

type CompleteProfileRequestBody = {
  firstName?: unknown;
  lastName?: unknown;
  barangay?: unknown;
  city?: unknown;
  province?: unknown;
};

function normalizeRequiredField(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().replace(/\s+/g, " ");
  return normalized.length > 0 ? normalized : null;
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json().catch(() => null)) as CompleteProfileRequestBody | null;
    const firstName = normalizeRequiredField(payload?.firstName);
    const lastName = normalizeRequiredField(payload?.lastName);
    const barangay = normalizeRequiredField(payload?.barangay);
    const city = normalizeRequiredField(payload?.city);
    const province = normalizeRequiredField(payload?.province);

    if (!firstName || !lastName || !barangay || !city || !province) {
      return fail(
        "All profile fields are required: first name, last name, barangay, city, and province.",
        400
      );
    }

    const client = await supabaseServer();
    const { data: authData, error: authError } = await client.auth.getUser();
    if (authError || !authData.user?.id) {
      return fail("Authentication required.", 401);
    }

    const userId = authData.user.id;
    const fullName = `${firstName} ${lastName}`.trim();
    const resolvedBarangay = await resolveCitizenBarangayByNames(client, {
      barangay,
      city,
      province,
    });

    if (!resolvedBarangay.ok) {
      return fail(resolvedBarangay.errorMessage, 400);
    }

    const profile = await getCitizenProfileByUserId(client, userId);
    if (profile && profile.role !== "citizen") {
      return fail("Only citizen accounts can complete this profile form.", 403);
    }

    if (profile) {
      if (
        profile.barangay_id &&
        profile.barangay_id !== resolvedBarangay.value.barangayId
      ) {
        return fail(
          "Your account is already linked to a different barangay. Contact support to update scope.",
          403
        );
      }

      const updatePayload = profile.barangay_id
        ? { full_name: fullName }
        : {
            full_name: fullName,
            role: "citizen" as const,
            barangay_id: resolvedBarangay.value.barangayId,
            city_id: null,
            municipality_id: null,
          };
      const { error: updateError } = await client
        .from("profiles")
        .update(updatePayload)
        .eq("id", userId);

      if (updateError) {
        if (
          updateError.message.toLowerCase().includes("scope is admin-managed") ||
          updateError.message.toLowerCase().includes("scope is")
        ) {
          return fail(
            "Your profile scope is managed by administrators. Contact support to complete account scope setup.",
            403
          );
        }
        return fail(updateError.message, 400);
      }

      return ok();
    }

    const { error: insertError } = await client.from("profiles").insert({
      id: userId,
      role: "citizen",
      full_name: fullName,
      email: authData.user.email ?? null,
      barangay_id: resolvedBarangay.value.barangayId,
      city_id: null,
      municipality_id: null,
    });

    if (insertError) {
      return fail(insertError.message, 400);
    }

    return ok();
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Unable to complete profile.",
      500
    );
  }
}
