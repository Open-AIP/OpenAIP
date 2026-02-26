export const DEFAULT_PROJECT_IMAGE_SRC = "/default/default-no-image.jpg";
export const PROJECT_LOGO_FALLBACK_SRC = "/brand/logo3.svg";

function normalizeImageUrl(imageUrl?: string | null): string | undefined {
  const normalized = typeof imageUrl === "string" ? imageUrl.trim() : "";
  return normalized.length > 0 ? normalized : undefined;
}

export function isUnavailableProjectImage(imageUrl?: string | null): boolean {
  const normalized = normalizeImageUrl(imageUrl);
  if (!normalized) return true;
  return normalized === DEFAULT_PROJECT_IMAGE_SRC;
}

export function resolveProjectImageSource(
  imageUrl: string | null | undefined,
  options: {
    useLogoFallback?: boolean;
    defaultSource?: string;
  } = {}
): string | undefined {
  const normalized = normalizeImageUrl(imageUrl);
  const { useLogoFallback = false, defaultSource } = options;

  if (useLogoFallback) {
    return isUnavailableProjectImage(normalized)
      ? PROJECT_LOGO_FALLBACK_SRC
      : normalized;
  }

  return normalized ?? defaultSource;
}
