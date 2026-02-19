/**
 * Utility functions for the Projects feature
 */

/**
 * Extract unique project years from a list of projects and sort them in descending order
 */
export function getProjectYears(items: Array<{ year: number }>) {
  return Array.from(new Set(items.map((x) => x.year))).sort((a, b) => b - a);
}
