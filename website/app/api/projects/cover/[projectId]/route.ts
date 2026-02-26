import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getProjectMediaBucketName } from "@/lib/projects/media";

type ProjectLookupRow = {
  id: string;
  aip_id: string;
  image_url: string | null;
};

type AipLookupRow = {
  id: string;
  status: "draft" | "pending_review" | "under_review" | "for_revision" | "published";
};

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function notFoundResponse() {
  return NextResponse.json({ message: "Project cover not found." }, { status: 404 });
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await context.params;
    const normalized = projectId.trim();
    if (!normalized) {
      return notFoundResponse();
    }

    const admin = supabaseAdmin();
    let projectRows: ProjectLookupRow[] = [];

    if (isUuid(normalized)) {
      const { data, error } = await admin
        .from("projects")
        .select("id,aip_id,image_url")
        .eq("id", normalized)
        .limit(2);
      if (error) {
        return notFoundResponse();
      }
      projectRows = (data ?? []) as ProjectLookupRow[];
    } else {
      const { data, error } = await admin
        .from("projects")
        .select("id,aip_id,image_url")
        .eq("aip_ref_code", normalized)
        .limit(2);
      if (error) {
        return notFoundResponse();
      }
      projectRows = (data ?? []) as ProjectLookupRow[];
    }

    if (projectRows.length !== 1) {
      return notFoundResponse();
    }

    const project = projectRows[0];
    const imagePath = project.image_url?.trim() ?? "";
    if (!imagePath) {
      return notFoundResponse();
    }

    const { data: aipRow, error: aipError } = await admin
      .from("aips")
      .select("id,status")
      .eq("id", project.aip_id)
      .maybeSingle();
    if (aipError || !aipRow) {
      return notFoundResponse();
    }

    const aip = aipRow as AipLookupRow;
    if (aip.status !== "published") {
      return notFoundResponse();
    }

    const bucketId = getProjectMediaBucketName();
    const { data: signed, error: signedError } = await admin.storage
      .from(bucketId)
      .createSignedUrl(imagePath, 60 * 5);
    if (signedError || !signed?.signedUrl) {
      return NextResponse.json(
        { message: signedError?.message ?? "Unable to generate cover image URL." },
        { status: 500 }
      );
    }

    return NextResponse.redirect(signed.signedUrl, { status: 307 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected project cover media error.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
