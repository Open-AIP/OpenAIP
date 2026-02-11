export type RepoErrorCode =
  | "NOT_FOUND"
  | "INVALID_INPUT"
  | "UNAUTHORIZED"
  | "UNKNOWN";

export class RepoError extends Error {
  code: RepoErrorCode;
  cause?: unknown;

  constructor(code: RepoErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = "RepoError";
    this.code = code;
    if (cause !== undefined) {
      this.cause = cause;
    }
  }
}

export class NotImplementedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotImplementedError";
  }
}

