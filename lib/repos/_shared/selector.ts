import { isMockEnabled } from "@/lib/config/appEnv";

export type RepoSelectionMode = "mock" | "supabase";

export function selectRepo<T>(input: {
  label: string;
  mock: () => T;
  supabase: () => T;
  forceMode?: RepoSelectionMode;
}): T {
  const mode =
    input.forceMode ?? (isMockEnabled() ? ("mock" satisfies RepoSelectionMode) : "supabase");

  return mode === "mock" ? input.mock() : input.supabase();
}

