import "server-only";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { supabaseServer } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof supabaseServer>>;

type AipStatus = "draft" | "pending_review" | "under_review" | "for_revision" | "published";

type PublishedAipLookupRow = {
  id: string;
  status: AipStatus;
  barangay_id: string | null;
  city_id: string | null;
  municipality_id: string | null;
};

type UploadedFileLookupRow = {
  id: string;
  aip_id: string;
  bucket_id: string;
  object_name: string;
  is_current: boolean;
  created_at: string;
};

type ScopeType = "barangay" | "city" | "municipality";

const CHAT_AIP_PDF_SIGNED_URL_TTL_SECONDS = 60 * 10;

export function normalizeAipId(value: string): string | null {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function resolveScopeColumn(scope: ScopeType): "barangay_id" | "city_id" | "municipality_id" {
  if (scope === "city") return "city_id";
  if (scope === "municipality") return "municipality_id";
  return "barangay_id";
}

export function aipPdfNotFoundResponse() {
  return NextResponse.json({ message: "AIP PDF not found." }, { status: 404 });
}

export function aipPdfSigningFailedResponse() {
  return NextResponse.json({ message: "Failed to generate AIP PDF URL." }, { status: 502 });
}

export async function resolvePublishedAipById(input: {
  client: SupabaseServerClient;
  aipId: string;
}): Promise<PublishedAipLookupRow | null> {
  const { data, error } = await input.client
    .from("aips")
    .select("id,status,barangay_id,city_id,municipality_id")
    .eq("id", input.aipId)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as PublishedAipLookupRow | null) ?? null;
}

export async function resolvePublishedAipByScope(input: {
  client: SupabaseServerClient;
  aipId: string;
  scope: ScopeType;
  scopeId: string;
}): Promise<PublishedAipLookupRow | null> {
  const scopeColumn = resolveScopeColumn(input.scope);
  const { data, error } = await input.client
    .from("aips")
    .select("id,status,barangay_id,city_id,municipality_id")
    .eq("id", input.aipId)
    .eq("status", "published")
    .eq(scopeColumn, input.scopeId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as PublishedAipLookupRow | null) ?? null;
}

export async function resolveCurrentAipUploadedFile(input: {
  client: SupabaseServerClient;
  aipId: string;
}): Promise<UploadedFileLookupRow | null> {
  const { data, error } = await input.client
    .from("uploaded_files")
    .select("id,aip_id,bucket_id,object_name,is_current,created_at")
    .eq("aip_id", input.aipId)
    .eq("is_current", true)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as UploadedFileLookupRow | null) ?? null;
}

export async function createSignedAipPdfUrl(
  file: UploadedFileLookupRow
): Promise<string | null> {
  const admin = supabaseAdmin();
  const { data, error } = await admin.storage
    .from(file.bucket_id)
    .createSignedUrl(file.object_name, CHAT_AIP_PDF_SIGNED_URL_TTL_SECONDS);

  if (error || !data?.signedUrl) {
    return null;
  }

  return data.signedUrl;
}
