import { randomUUID, createHash } from "crypto";
import { NextResponse } from "next/server";
import { getActorContext } from "@/lib/domain/get-actor-context";
import { writeWorkflowActivityLog } from "@/lib/audit/activity-log";
import { assertActorCanManageBarangayAipWorkflow } from "@/lib/repos/aip/workflow-permissions.server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";

const MAX_BYTES = 10 * 1024 * 1024;
const BUCKET_ID = "aip-pdfs";

function isPdfFile(file: File): boolean {
  if (file.type === "application/pdf") return true;
  return file.name.toLowerCase().endsWith(".pdf");
}

export async function POST(request: Request) {
  try {
    const actor = await getActorContext();
    if (!actor || actor.role !== "barangay_official" || actor.scope.kind !== "barangay" || !actor.scope.id) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const form = await request.formData();
    const file = form.get("file");
    const yearRaw = form.get("year");

    if (!(file instanceof File)) {
      return NextResponse.json({ message: "Please upload an AIP PDF file." }, { status: 400 });
    }
    if (!isPdfFile(file)) {
      return NextResponse.json({ message: "PDF only. Please upload a .pdf file." }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ message: "File too large. Maximum file size is 10MB." }, { status: 400 });
    }

    const fiscalYear = Number(yearRaw);
    if (!Number.isInteger(fiscalYear) || fiscalYear < 2000 || fiscalYear > 2100) {
      return NextResponse.json({ message: "Invalid AIP year." }, { status: 400 });
    }

    const client = await supabaseServer();

    const { data: existing, error: existingError } = await client
      .from("aips")
      .select("id,status")
      .eq("barangay_id", actor.scope.id)
      .eq("fiscal_year", fiscalYear)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json({ message: existingError.message }, { status: 400 });
    }

    const hadExistingAip = Boolean(existing?.id);
    let aipId = existing?.id ?? null;
    let aipStatus = existing?.status ?? null;

    if (existing && existing.status !== "draft" && existing.status !== "for_revision") {
      return NextResponse.json(
        { message: "This fiscal year already has a non-editable AIP record." },
        { status: 409 }
      );
    }
    if (existing?.id) {
      try {
        await assertActorCanManageBarangayAipWorkflow({
          aipId: existing.id,
          actor,
        });
      } catch (error) {
        return NextResponse.json(
          {
            message:
              error instanceof Error
                ? error.message
                : "Only the uploader of this AIP can modify this workflow.",
          },
          { status: 403 }
        );
      }
    }

    if (!aipId) {
      const { data: created, error: createError } = await client
        .from("aips")
        .insert({
          fiscal_year: fiscalYear,
          barangay_id: actor.scope.id,
          city_id: null,
          municipality_id: null,
          status: "draft",
        })
        .select("id,status")
        .single();

      if (createError || !created) {
        return NextResponse.json(
          { message: createError?.message ?? "Failed to create AIP record." },
          { status: 400 }
        );
      }

      aipId = created.id;
      aipStatus = created.status;
    }

    const { data: canUpload, error: canUploadError } = await client.rpc("can_upload_aip_pdf", {
      p_aip_id: aipId,
    });
    if (canUploadError) {
      return NextResponse.json({ message: canUploadError.message }, { status: 400 });
    }
    if (!canUpload) {
      return NextResponse.json({ message: "You cannot upload for this AIP right now." }, { status: 403 });
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const sha256Hex = createHash("sha256").update(fileBuffer).digest("hex");
    const objectName = `${aipId}/${randomUUID()}.pdf`;

    const admin = supabaseAdmin();
    const { error: storageError } = await admin.storage
      .from(BUCKET_ID)
      .upload(objectName, fileBuffer, {
        contentType: "application/pdf",
        upsert: false,
      });
    if (storageError) {
      return NextResponse.json({ message: storageError.message }, { status: 400 });
    }

    const { data: fileRow, error: fileInsertError } = await client
      .from("uploaded_files")
      .insert({
        aip_id: aipId,
        bucket_id: BUCKET_ID,
        object_name: objectName,
        original_file_name: file.name,
        mime_type: "application/pdf",
        size_bytes: file.size,
        sha256_hex: sha256Hex,
        is_current: true,
        uploaded_by: actor.userId,
      })
      .select("id")
      .single();

    if (fileInsertError || !fileRow) {
      await admin.storage.from(BUCKET_ID).remove([objectName]);
      return NextResponse.json(
        { message: fileInsertError?.message ?? "Failed to insert upload metadata." },
        { status: 400 }
      );
    }

    const { data: runRow, error: runInsertError } = await admin
      .from("extraction_runs")
      .insert({
        aip_id: aipId,
        uploaded_file_id: fileRow.id,
        stage: "extract",
        status: "queued",
        model_name: "gpt-5.2",
        created_by: actor.userId,
      })
      .select("id,status")
      .single();

    if (runInsertError || !runRow) {
      return NextResponse.json(
        { message: runInsertError?.message ?? "Failed to queue extraction run." },
        { status: 400 }
      );
    }

    try {
      if (hadExistingAip) {
        await writeWorkflowActivityLog({
          action: "revision_uploaded",
          entityTable: "aips",
          entityId: aipId,
          scope: { barangayId: actor.scope.id },
          metadata: {
            details: `Uploaded a revised AIP PDF for fiscal year ${fiscalYear}.`,
            aip_status: aipStatus,
            fiscal_year: fiscalYear,
            file_name: file.name,
          },
        });
      } else {
        await writeWorkflowActivityLog({
          action: "draft_created",
          entityTable: "aips",
          entityId: aipId,
          scope: { barangayId: actor.scope.id },
          hideCrudAction: "aip_created",
          metadata: {
            details: `Created a new AIP draft for fiscal year ${fiscalYear} and uploaded the first PDF.`,
            aip_status: aipStatus,
            fiscal_year: fiscalYear,
            file_name: file.name,
          },
        });
      }
    } catch (error) {
      console.error("[AIP_UPLOAD] workflow activity log failed", {
        aipId,
        fiscalYear,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return NextResponse.json(
      {
        aipId,
        status: runRow.status,
        runId: runRow.id,
        aipStatus,
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected upload error.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
