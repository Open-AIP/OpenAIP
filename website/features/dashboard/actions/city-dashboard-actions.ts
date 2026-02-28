"use server";

import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/actions/auth.actions";
import { DASHBOARD_REPLY_MAX_LENGTH } from "@/lib/repos/dashboard/repo";
import { getDashboardRepo } from "@/lib/repos/dashboard/repo.server";

export async function createCityDraftAipAction(formData: FormData) {
  const fiscalYear = Number.parseInt(String(formData.get("fiscalYear") ?? "").trim(), 10);
  if (!Number.isInteger(fiscalYear) || fiscalYear < 2000 || fiscalYear > 2100) {
    throw new Error("Invalid fiscal year.");
  }

  const user = await getUser();
  if (user.role !== "city_official" || !user.cityId) throw new Error("Unauthorized.");

  const repo = getDashboardRepo();
  await repo.createDraftAip({
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
  if (body.length > DASHBOARD_REPLY_MAX_LENGTH) {
    throw new Error(`Reply body must be at most ${DASHBOARD_REPLY_MAX_LENGTH} characters.`);
  }

  const user = await getUser();
  if (user.role !== "city_official" || !user.cityId) throw new Error("Unauthorized.");

  const repo = getDashboardRepo();
  await repo.replyToFeedback({
    scope: "city",
    scopeId: user.cityId,
    parentFeedbackId,
    body,
    authorId: user.userId,
  });

  revalidatePath("/city");
  revalidatePath("/city/feedback");
}
