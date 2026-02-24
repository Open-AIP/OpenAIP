export const EMBED_SKIP_NO_ARTIFACT_MESSAGE = "No categorize artifact; skipping.";

export function isEmbedSkipNoArtifactMessage(
  value: string | null | undefined
): boolean {
  if (typeof value !== "string") return false;
  return value.trim() === EMBED_SKIP_NO_ARTIFACT_MESSAGE;
}
