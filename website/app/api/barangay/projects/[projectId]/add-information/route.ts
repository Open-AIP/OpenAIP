import { handleAddInformationRequest } from "@/app/api/projects/_shared/write-handlers";

export async function POST(
  request: Request,
  context: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await context.params;
  return handleAddInformationRequest({
    request,
    scope: "barangay",
    projectIdOrRef: projectId,
  });
}
