import { NextResponse } from "next/server";
import { isCitizenProfileComplete } from "@/lib/auth/citizen-profile-completion";
import type { RoleType } from "@/lib/contracts/databasev2";
import { supabaseServer } from "@/lib/supabase/server";
import {
  aipPdfNotFoundResponse,
  aipPdfSigningFailedResponse,
  createSignedAipPdfUrl,
  normalizeAipId,
  resolveCurrentAipUploadedFile,
  resolvePublishedAipById,
} from "@/app/api/chat/_shared/aip-pdf-redirect";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ aipId: string }>;
};

type CitizenProfileRow = {
  id: string;
  role: RoleType | null;
  full_name: string | null;
  barangay_id: string | null;
  city_id: string | null;
  municipality_id: string | null;
};

function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function forbiddenResponse(message: string) {
  return NextResponse.json({ error: message }, { status: 403 });
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { aipId: rawAipId } = await context.params;
    const aipId = normalizeAipId(rawAipId);
    if (!aipId) {
      return aipPdfNotFoundResponse();
    }

    const client = await supabaseServer();
    const { data: authData, error: authError } = await client.auth.getUser();
    if (authError || !authData.user?.id) {
      return unauthorizedResponse();
    }

    const { data: profileData, error: profileError } = await client
      .from("profiles")
      .select("id,role,full_name,barangay_id,city_id,municipality_id")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    const profile = (profileData as CitizenProfileRow | null) ?? null;
    if (!profile || profile.role !== "citizen") {
      return forbiddenResponse("Only citizens can use this endpoint.");
    }
    if (!isCitizenProfileComplete(profile)) {
      return forbiddenResponse("Complete your profile before using the AI Assistant.");
    }

    const aip = await resolvePublishedAipById({
      client,
      aipId,
    });
    if (!aip) {
      return aipPdfNotFoundResponse();
    }

    const uploadedFile = await resolveCurrentAipUploadedFile({
      client,
      aipId: aip.id,
    });
    if (!uploadedFile) {
      return aipPdfNotFoundResponse();
    }

    const signedUrl = await createSignedAipPdfUrl(uploadedFile);
    if (!signedUrl) {
      return aipPdfSigningFailedResponse();
    }

    return NextResponse.redirect(signedUrl, 307);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unexpected citizen chatbot AIP PDF lookup error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
