import { NextResponse } from "next/server";
import { toImageResponse } from "@/app/api/projects/_shared/image-response";
import { readProjectCoverBlob } from "@/lib/supabase/privileged-ops";

function notFoundResponse() {
  return NextResponse.json({ message: "Project cover not found." }, { status: 404 });
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await context.params;
    const normalized = projectId.trim();
    if (!normalized) {
      return notFoundResponse();
    }

    const projectCover = await readProjectCoverBlob({
      actor: null,
      projectIdOrRef: normalized,
    });
    if (!projectCover) {
      return notFoundResponse();
    }

    return toImageResponse(projectCover.imageData, projectCover.imagePath);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected project cover media error.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
