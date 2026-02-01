import type { AipRepo } from "../data/aip-repo";
import { getAipRepo } from "./aip-repo.selector";
import type { CreateMockAipRepoOptions } from "./aip-repo.mock-impl";

export type { CreateMockAipRepoOptions };

/**
 * Backwards-compatible export that now routes through the selector.
 */
export function createMockAipRepo(
  options: CreateMockAipRepoOptions = {}
): AipRepo {
  return getAipRepo(options);
}
