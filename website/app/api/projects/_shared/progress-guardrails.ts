export function getCurrentProgressBaseline(
  rows: Array<{ progress_percent: number | null }> | null | undefined
): number {
  if (!rows?.length) return 0;
  const candidate = rows[0]?.progress_percent;
  if (typeof candidate !== "number" || !Number.isFinite(candidate)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.trunc(candidate)));
}

export function isStrictlyIncreasingProgress(
  progressPercent: number,
  currentBaselineProgress: number
): boolean {
  return progressPercent > currentBaselineProgress;
}
