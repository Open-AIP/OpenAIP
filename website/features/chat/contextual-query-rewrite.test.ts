import { describe, expect, it } from "vitest";
import { maybeRewriteFollowUpQuery } from "@/lib/chat/contextual-query-rewrite";
import type { ChatMessage } from "@/lib/repos/chat/types";

function message(input: {
  id: string;
  role: "user" | "assistant";
  content: string;
}): ChatMessage {
  return {
    id: input.id,
    sessionId: "session-1",
    role: input.role,
    content: input.content,
    createdAt: "2026-03-06T00:00:00.000Z",
  };
}

describe("contextual query rewrite", () => {
  it("rewrites safe year follow-up into standalone query", () => {
    const messages: ChatMessage[] = [
      message({
        id: "u1",
        role: "user",
        content: "What were the health expenditures in 2024?",
      }),
      message({
        id: "a1",
        role: "assistant",
        content: "The health expenditures in 2024 were ...",
      }),
    ];

    const result = maybeRewriteFollowUpQuery({
      message: "How about 2025?",
      messages,
    });
    expect(result.kind).toBe("rewritten");
    if (result.kind !== "rewritten") return;
    expect(result.query).toContain("2025");
    expect(result.reason).toBe("safe_year_follow_up");
  });

  it("rewrites citation follow-up", () => {
    const messages: ChatMessage[] = [
      message({
        id: "u1",
        role: "user",
        content: "Explain the drainage project in Barangay Mamatid.",
      }),
      message({
        id: "a1",
        role: "assistant",
        content: "Drainage details...",
      }),
    ];

    const result = maybeRewriteFollowUpQuery({
      message: "Can you cite it?",
      messages,
    });
    expect(result.kind).toBe("rewritten");
    if (result.kind !== "rewritten") return;
    expect(result.query.toLowerCase()).toContain("citations");
    expect(result.query.toLowerCase()).toContain("drainage");
  });

  it("keeps standalone metadata query unchanged", () => {
    const result = maybeRewriteFollowUpQuery({
      message: "What fund sources exist in Barangay Mamatid?",
      messages: [],
    });
    expect(result.kind).toBe("unchanged");
  });

  it("keeps greetings unchanged", () => {
    const result = maybeRewriteFollowUpQuery({
      message: "Hello",
      messages: [],
    });
    expect(result.kind).toBe("unchanged");
  });

  it("asks clarification for risky follow-up with ambiguous anchors", () => {
    const messages: ChatMessage[] = [
      message({
        id: "u1",
        role: "user",
        content: "Explain the drainage project in Barangay Mamatid.",
      }),
      message({
        id: "a1",
        role: "assistant",
        content: "Drainage details...",
      }),
      message({
        id: "u2",
        role: "user",
        content: "What were the health expenditures in 2024?",
      }),
      message({
        id: "a2",
        role: "assistant",
        content: "Health details...",
      }),
    ];

    const result = maybeRewriteFollowUpQuery({
      message: "Explain that.",
      messages,
    });
    expect(result.kind).toBe("clarify");
  });
});
