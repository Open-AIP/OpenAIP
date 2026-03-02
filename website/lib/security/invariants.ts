import type { RoleType } from "@/lib/contracts/databasev2";

export class InvariantError extends Error {
  readonly status: 400 | 401 | 403;

  constructor(status: 400 | 401 | 403, message: string) {
    super(message);
    this.status = status;
  }
}

export function isInvariantError(error: unknown): error is InvariantError {
  return error instanceof InvariantError;
}

export function assertInvariant(
  condition: unknown,
  status: 400 | 401 | 403,
  message: string
): asserts condition {
  if (!condition) {
    throw new InvariantError(status, message);
  }
}

export function assertActorPresent<T>(
  actor: T | null | undefined,
  message = "Unauthorized."
): asserts actor is T {
  assertInvariant(!!actor, 401, message);
}

export function assertActorRole(
  actor: { role: RoleType } | null | undefined,
  allowedRoles: RoleType[],
  message = "Unauthorized."
): void {
  assertActorPresent(actor, message);
  assertInvariant(allowedRoles.includes(actor.role), 403, message);
}

export function assertNonEmptyString(
  value: unknown,
  message: string
): asserts value is string {
  assertInvariant(typeof value === "string" && value.trim().length > 0, 400, message);
}

export function assertPositiveInteger(
  value: unknown,
  message: string
): asserts value is number {
  assertInvariant(Number.isInteger(value) && Number(value) > 0, 400, message);
}
