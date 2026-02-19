export function getProjectYears(items: Array<{ year: number }>) {
  return Array.from(new Set(items.map((x) => x.year))).sort((a, b) => b - a);
}
