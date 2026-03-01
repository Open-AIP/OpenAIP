import { handleProjectFeedbackReplyRequest } from "@/app/api/projects/_shared/feedback-reply-handlers";

export async function POST(
  request: Request,
  context: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await context.params;
  return handleProjectFeedbackReplyRequest({
    request,
    scope: "city",
    projectIdOrRef: projectId,
  });
}
