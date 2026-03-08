import { describe, expect, it } from "vitest";
import {
  getChatStrategyConfigSnapshot,
  type ChatStrategyConfigSnapshot,
} from "@/lib/chat/chat-strategy-config";
import {
  CONTEXTUAL_REWRITE_MAX_ASSISTANT_TURNS,
  CONTEXTUAL_REWRITE_MAX_USER_TURNS,
} from "@/lib/chat/contextual-query-rewrite";

describe("chat strategy config snapshot", () => {
  it("returns active flags and calibration tunables", () => {
    process.env.CHAT_RAG_ONLY_ENFORCED = "true";
    process.env.CHAT_CONTEXTUAL_REWRITE_ENABLED = "true";
    process.env.CHAT_SEMANTIC_REPEAT_CACHE_ENABLED = "true";
    process.env.CHAT_SPLIT_VERIFIER_POLICY_ENABLED = "true";

    const snapshot: ChatStrategyConfigSnapshot = getChatStrategyConfigSnapshot();

    expect(snapshot.flags.CHAT_RAG_ONLY_ENFORCED).toBe(true);
    expect(snapshot.flags.CHAT_CONTEXTUAL_REWRITE_ENABLED).toBe(true);
    expect(snapshot.flags.CHAT_SEMANTIC_REPEAT_CACHE_ENABLED).toBe(true);
    expect(snapshot.flags.CHAT_SPLIT_VERIFIER_POLICY_ENABLED).toBe(true);

    expect(snapshot.calibration.rewrite_max_user_turns).toBe(CONTEXTUAL_REWRITE_MAX_USER_TURNS);
    expect(snapshot.calibration.rewrite_max_assistant_turns).toBe(
      CONTEXTUAL_REWRITE_MAX_ASSISTANT_TURNS
    );
  });
});
