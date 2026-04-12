import { NextResponse } from "next/server";
import { getLguChatAuthFailure } from "@/lib/chat/lgu-route-auth";
import { getActorContext } from "@/lib/domain/get-actor-context";
import { assertActorPresent, assertPrivilegedWriteAccess, isInvariantError } from "@/lib/security/invariants";
import { supabaseServer } from "@/lib/supabase/server";
import {
  aipPdfNotFoundResponse,
  aipPdfSigningFailedResponse,
  createSignedAipPdfUrl,
  normalizeAipId,
  resolveCurrentAipUploadedFile,
  resolvePublishedAipByScope,
} from "@/app/api/chat/_shared/aip-pdf-redirect";

export const dynamic = "force-dynamic";

type LguRouteScope = "barangay" | "city";
type RouteContext = {
  params: Promise<{ aipId: string }>;
};

function resolveExpectedRouteScope(request: Request): LguRouteScope {
  const pathname = new URL(request.url).pathname.toLowerCase();
  return pathname.includes("/api/city/chat/") ? "city" : "barangay";
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const routeScope = resolveExpectedRouteScope(request);
    const actor = await getActorContext();
    const authFailure = getLguChatAuthFailure(routeScope, actor, "messages");
    if (authFailure) {
      return NextResponse.json({ message: authFailure.message }, { status: authFailure.status });
    }

    assertActorPresent(actor, "Authentication required.");
    const authorizedActor = assertPrivilegedWriteAccess({
      actor,
      allowlistedRoles: ["barangay_official", "city_official"],
      scopeByRole: {
        barangay_official: "barangay",
        city_official: "city",
      },
      requireScopeId: true,
      message: "Forbidden. Missing required LGU scope.",
    });

    const { aipId: rawAipId } = await context.params;
    const aipId = normalizeAipId(rawAipId);
    if (!aipId) {
      return aipPdfNotFoundResponse();
    }

    const client = await supabaseServer();
    const aip = await resolvePublishedAipByScope({
      client,
      aipId,
      scope: routeScope,
      scopeId: authorizedActor.scopeId!,
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
    if (isInvariantError(error)) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    const message =
      error instanceof Error
        ? error.message
        : "Unexpected LGU chatbot AIP PDF lookup error.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
