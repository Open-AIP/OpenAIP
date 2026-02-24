"use server";

import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/actions/auth.actions";
import { createDraftAip, replyToFeedback } from "@/lib/repo/dashboard-repo";

export async function createBarangayDraftAipAction(formData: FormData) {
  const fiscalYear = Number.parseInt(String(formData.get("fiscalYear") ?? "").trim(), 10);
  if (!Number.isFinite(fiscalYear)) throw new Error("Invalid fiscal year.");

  const user = await getUser();
  if (user.role !== "barangay_official" || !user.barangayId) throw new Error("Unauthorized.");

  await createDraftAip({
    scope: "barangay",
    scopeId: user.barangayId,
    fiscalYear,
    createdBy: user.userId,
  });

  revalidatePath("/barangay");
  revalidatePath("/barangay/aips");
}

export async function replyBarangayFeedbackAction(formData: FormData) {
  const parentFeedbackId = String(formData.get("parentFeedbackId") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!parentFeedbackId || !body) throw new Error("Reply body is required.");

  const user = await getUser();
  if (user.role !== "barangay_official") throw new Error("Unauthorized.");

  await replyToFeedback({ parentFeedbackId, body, authorId: user.userId });

  revalidatePath("/barangay");
  revalidatePath("/barangay/comments");
}
