import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { toImageResponse } from "@/app/api/projects/_shared/image-response";
import { getActorContext } from "@/lib/domain/get-actor-context";
import type { ActorContext } from "@/lib/domain/actor-context";

type ProjectUpdateMediaLookupRow = {
  id: string;
  bucket_id: string;
  object_name: string;
  project_id: string;
  update_id: string;
};

type ProjectUpdateLookupRow = {
  id: string;
  project_id: string;
  aip_id: string;
  status: "active" | "hidden";
};

type AipLookupRow = {
  id: string;
  status: "draft" | "pending_review" | "under_review" | "for_revision" | "published";
  city_id: string | null;
  municipality_id: string | null;
  barangay_id: string | null;
};

function notFoundResponse() {
  return NextResponse.json({ message: "Media not found." }, { status: 404 });
}

function canReadHiddenMedia(actor: ActorContext | null, aip: AipLookupRow): boolean {
  if (!actor) return false;
  if (actor.role === "admin") return true;
  if (!actor.scope.id) return false;

  if (actor.role === "city_official" && actor.scope.kind === "city") {
    return aip.city_id === actor.scope.id;
  }
  if (actor.role === "municipal_official" && actor.scope.kind === "municipality") {
    return aip.municipality_id === actor.scope.id;
  }
  if (actor.role === "barangay_official" && actor.scope.kind === "barangay") {
    return aip.barangay_id === actor.scope.id;
  }
  return false;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ mediaId: string }> }
) {
  try {
    const { mediaId } = await context.params;
    if (!mediaId.trim()) {
      return notFoundResponse();
    }

    const admin = supabaseAdmin();

    const { data: mediaRow, error: mediaError } = await admin
      .from("project_update_media")
      .select("id,bucket_id,object_name,project_id,update_id")
      .eq("id", mediaId)
      .maybeSingle();
    if (mediaError || !mediaRow) {
      return notFoundResponse();
    }

    const media = mediaRow as ProjectUpdateMediaLookupRow;
    const { data: updateRow, error: updateError } = await admin
      .from("project_updates")
      .select("id,project_id,aip_id,status")
      .eq("id", media.update_id)
      .maybeSingle();
    if (updateError || !updateRow) {
      return notFoundResponse();
    }

    const update = updateRow as ProjectUpdateLookupRow;
    if (update.project_id !== media.project_id) {
      return notFoundResponse();
    }

    const { data: aipRow, error: aipError } = await admin
      .from("aips")
      .select("id,status,city_id,municipality_id,barangay_id")
      .eq("id", update.aip_id)
      .maybeSingle();
    if (aipError || !aipRow) {
      return notFoundResponse();
    }

    const aip = aipRow as AipLookupRow;
    if (update.status === "active" && aip.status !== "published") {
      return notFoundResponse();
    }

    if (update.status === "hidden") {
      const actor = await getActorContext();
      if (!canReadHiddenMedia(actor, aip)) {
        return notFoundResponse();
      }
    }

    const { data: imageData, error: downloadError } = await admin.storage
      .from(media.bucket_id)
      .download(media.object_name);
    if (downloadError || !imageData) {
      return notFoundResponse();
    }

    return toImageResponse(imageData, media.object_name);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected media error.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
