import type { AipStatus } from "@/lib/contracts/databasev2";

type AipVisibilityInput = {
  status: AipStatus | string | null | undefined;
};

/**
 * DBV2 public-read baseline:
 * citizen/public surfaces should only expose published AIP contexts.
 */
export function canPublicReadAip(input: AipVisibilityInput): boolean {
  return input.status === "published";
}

