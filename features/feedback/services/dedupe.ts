export function dedupeByKey<T>(
  items: T[],
  getKey: (item: T) => string
): T[] {
  const seen = new Set<string>();
  const unique: T[] = [];

  for (const item of items) {
    const key = getKey(item);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
  }

  return unique;
}

export function findDuplicateKeys<T>(
  items: T[],
  getKey: (item: T) => string
): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const item of items) {
    const key = getKey(item);
    if (seen.has(key)) {
      duplicates.add(key);
    } else {
      seen.add(key);
    }
  }

  return Array.from(duplicates);
}

