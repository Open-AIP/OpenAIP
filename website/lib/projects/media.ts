export const DEFAULT_PROJECT_MEDIA_BUCKET = "project-media";

export function getProjectMediaBucketName(): string {
  const raw = process.env.SUPABASE_STORAGE_PROJECT_MEDIA_BUCKET;
  const trimmed = typeof raw === "string" ? raw.trim() : "";
  return trimmed.length > 0 ? trimmed : DEFAULT_PROJECT_MEDIA_BUCKET;
}

export function toProjectUpdateMediaProxyUrl(mediaId: string): string {
  return `/api/projects/media/${encodeURIComponent(mediaId)}`;
}

export function toProjectCoverProxyUrl(projectId: string): string {
  return `/api/projects/cover/${encodeURIComponent(projectId)}`;
}
