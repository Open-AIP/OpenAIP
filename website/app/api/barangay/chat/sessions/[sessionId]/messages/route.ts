import { NextResponse } from "next/server";
import { getActorContext } from "@/lib/domain/get-actor-context";
import { getChatRepo } from "@/lib/repos/chat/repo.server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ sessionId: string }> }
) {
  try {
    const actor = await getActorContext();
    if (!actor || actor.role !== "barangay_official") {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const { sessionId } = await context.params;
    const repo = getChatRepo();
    const session = await repo.getSession(sessionId);
    if (!session || session.userId !== actor.userId) {
      return NextResponse.json({ message: "Session not found." }, { status: 404 });
    }

    const messages = await repo.listMessages(sessionId);
    return NextResponse.json({ session, messages }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected chat message lookup error.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
