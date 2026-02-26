import { NextResponse } from "next/server";
import { getActorContext } from "@/lib/domain/get-actor-context";
import { getChatRepo } from "@/lib/repos/chat/repo.server";

export async function GET() {
  try {
    const actor = await getActorContext();
    if (!actor || actor.role !== "city_official") {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const repo = getChatRepo();
    const sessions = await repo.listSessions(actor.userId);
    return NextResponse.json({ sessions }, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unexpected chat session lookup error.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const actor = await getActorContext();
    if (!actor || actor.role !== "city_official") {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      title?: string;
      context?: unknown;
    };

    const repo = getChatRepo();
    const session = await repo.createSession(actor.userId, {
      title: body.title,
      context: body.context,
    });

    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unexpected chat session creation error.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

