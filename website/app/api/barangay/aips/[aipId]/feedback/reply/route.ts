import { handleScopedAipFeedbackReplyRequest } from "@/app/api/aips/_shared/feedback-reply-handlers";

export async function POST(
  request: Request,
  context: { params: Promise<{ aipId: string }> }
) {
  const { aipId } = await context.params;
  return handleScopedAipFeedbackReplyRequest({
    request,
    scope: "barangay",
    aipId,
  });
}
