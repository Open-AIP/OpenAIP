export type AppEnv = "dev" | "staging" | "prod";

/**
 * Client-safe env flag. Defaults to "dev" so behavior stays mock unless enabled.
 */
export function getAppEnv(): AppEnv {
  const raw = process.env.NEXT_PUBLIC_APP_ENV?.toLowerCase();
  if (raw === "staging" || raw === "prod" || raw === "dev") return raw;
  return "dev";
}

export function isMockEnabled(): boolean {
  return getAppEnv() === "dev";
}
