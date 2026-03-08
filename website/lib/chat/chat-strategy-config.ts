import {
  CONTEXTUAL_REWRITE_MAX_ASSISTANT_TURNS,
  CONTEXTUAL_REWRITE_MAX_USER_TURNS,
} from "@/lib/chat/contextual-query-rewrite";

type StrategyFlags = {
  CHAT_RAG_ONLY_ENFORCED: boolean;
  CHAT_CONTEXTUAL_REWRITE_ENABLED: boolean;
  CHAT_SEMANTIC_REPEAT_CACHE_ENABLED: boolean;
  CHAT_SPLIT_VERIFIER_POLICY_ENABLED: boolean;
};

export type ChatStrategyCalibrationSnapshot = {
  rewrite_max_user_turns: number;
  rewrite_max_assistant_turns: number;
};

export type ChatStrategyConfigSnapshot = {
  flags: StrategyFlags;
  calibration: ChatStrategyCalibrationSnapshot;
};

function boolEnv(name: string, fallback: boolean): boolean {
  const value = process.env[name];
  if (value == null) return fallback;
  return value.trim().toLowerCase() === "true";
}

export function getChatStrategyConfigSnapshot(): ChatStrategyConfigSnapshot {
  return {
    flags: {
      CHAT_RAG_ONLY_ENFORCED: process.env.CHAT_RAG_ONLY_ENFORCED !== "false",
      CHAT_CONTEXTUAL_REWRITE_ENABLED: boolEnv("CHAT_CONTEXTUAL_REWRITE_ENABLED", false),
      CHAT_SEMANTIC_REPEAT_CACHE_ENABLED: boolEnv("CHAT_SEMANTIC_REPEAT_CACHE_ENABLED", false),
      CHAT_SPLIT_VERIFIER_POLICY_ENABLED: process.env.CHAT_SPLIT_VERIFIER_POLICY_ENABLED !== "false",
    },
    calibration: {
      rewrite_max_user_turns: CONTEXTUAL_REWRITE_MAX_USER_TURNS,
      rewrite_max_assistant_turns: CONTEXTUAL_REWRITE_MAX_ASSISTANT_TURNS,
    },
  };
}
