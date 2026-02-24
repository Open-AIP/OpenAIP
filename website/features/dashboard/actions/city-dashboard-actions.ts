"use server";

import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/actions/auth.actions";
import { createDraftAip, replyToFeedback } from "@/lib/repo/dashboard-repo";

export async function createCityDraftAipAction(formData: FormData) {
  const fiscalYear = Number.parseInt(String(formData.get("fiscalYear") ?? "").trim(), 10);
  if (!Number.isFinite(fiscalYear)) throw new Error("Invalid fiscal year.");

  const user = await getUser();
  if (user.role !== "city_official" || !user.cityId) throw new Error("Unauthorized.");

  await createDraftAip({
    scope: "city",
    scopeId: user.cityId,
    fiscalYear,
    createdBy: user.userId,
  });

  revalidatePath("/city");
  revalidatePath("/city/aips");
}

export async function replyCityFeedbackAction(formData: FormData) {
  const parentFeedbackId = String(formData.get("parentFeedbackId") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!parentFeedbackId || !body) throw new Error("Reply body is required.");

  const user = await getUser();
  if (user.role !== "city_official") throw new Error("Unauthorized.");

  await replyToFeedback({ parentFeedbackId, body, authorId: user.userId });

  revalidatePath("/city");
  revalidatePath("/city/comments");
}
