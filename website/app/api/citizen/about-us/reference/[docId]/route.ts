import { NextResponse } from "next/server";
import { getCitizenAboutUsReferenceDocById } from "@/lib/content/citizen-about-us";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const SIGNED_URL_TTL_SECONDS = 60 * 10;

function notFoundResponse() {
  return NextResponse.json({ message: "Reference document not found." }, { status: 404 });
}

function upstreamFailureResponse(message = "Failed to generate reference document URL.") {
  return NextResponse.json({ message }, { status: 502 });
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ docId: string }> }
) {
  try {
    const { docId } = await context.params;
    const doc = await getCitizenAboutUsReferenceDocById(docId);
    if (!doc) {
      return notFoundResponse();
    }

    if (doc.kind === "external") {
      return NextResponse.redirect(doc.externalUrl, 307);
    }

    const admin = supabaseAdmin();
    const { data, error } = await admin.storage
      .from(doc.bucketId)
      .createSignedUrl(doc.objectName, SIGNED_URL_TTL_SECONDS);

    if (error || !data?.signedUrl) {
      return upstreamFailureResponse(error?.message);
    }

    return NextResponse.redirect(data.signedUrl, 307);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected error while loading reference document.";
    return upstreamFailureResponse(message);
  }
}
