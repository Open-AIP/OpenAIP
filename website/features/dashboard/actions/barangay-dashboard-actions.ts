"use server";

import { revalidatePath } from "next/cache";
import { writeWorkflowActivityLog } from "@/lib/audit/activity-log";
import { getUser } from "@/lib/actions/auth.actions";
import { DASHBOARD_REPLY_MAX_LENGTH } from "@/lib/repos/dashboard/repo";
import { getDashboardRepo } from "@/lib/repos/dashboard/repo.server";

export async function createBarangayDraftAipAction(formData: FormData) {
  const fiscalYear = Number.parseInt(String(formData.get("fiscalYear") ?? "").trim(), 10);
  if (!Number.isInteger(fiscalYear) || fiscalYear < 2000 || fiscalYear > 2100) {
    throw new Error("Invalid fiscal year.");
  }

  const user = await getUser();
  if (user.role !== "barangay_official" || !user.barangayId) throw new Error("Unauthorized.");

  const repo = getDashboardRepo();
  const result = await repo.createDraftAip({
    scope: "barangay",
    scopeId: user.barangayId,
    fiscalYear,
    createdBy: user.userId,
  });

  if (result.created && result.aipId) {
    try {
      await writeWorkflowActivityLog({
        action: "draft_created",
        entityTable: "aips",
        entityId: result.aipId,
        scope: { barangayId: user.barangayId },
        hideCrudAction: "aip_created",
        metadata: {
          details: `Created a new AIP draft for fiscal year ${fiscalYear}.`,
          fiscal_year: fiscalYear,
          aip_status: "draft",
        },
      });
    } catch (error) {
      console.error("[DASHBOARD] failed to log barangay draft creation activity", {
        aipId: result.aipId,
        fiscalYear,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  revalidatePath("/barangay");
  revalidatePath("/barangay/aips");
}

export async function replyBarangayFeedbackAction(formData: FormData) {
  const parentFeedbackId = String(formData.get("parentFeedbackId") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!parentFeedbackId || !body) throw new Error("Reply body is required.");
  if (body.length > DASHBOARD_REPLY_MAX_LENGTH) {
    throw new Error(`Reply body must be at most ${DASHBOARD_REPLY_MAX_LENGTH} characters.`);
  }

  const user = await getUser();
  if (user.role !== "barangay_official" || !user.barangayId) throw new Error("Unauthorized.");

  const repo = getDashboardRepo();
  await repo.replyToFeedback({
    scope: "barangay",
    scopeId: user.barangayId,
    parentFeedbackId,
    body,
    authorId: user.userId,
  });

  revalidatePath("/barangay");
  revalidatePath("/barangay/feedback");
}
