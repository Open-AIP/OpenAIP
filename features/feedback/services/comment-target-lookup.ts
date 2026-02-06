import { getAppEnv } from "@/shared/config/appEnv";
import { NotImplementedError } from "@/shared/errors/notImplemented";
import type { CommentTargetLookup } from "./resolve-comment-sidebar";
import { createMockCommentTargetLookup } from "./comment-target-lookup.mock";

/**
 * Central selector: decide which lookup to use.
 * - dev => mock
 * - staging/prod => throw until Supabase lookup exists
 */
export function getCommentTargetLookup(): CommentTargetLookup {
  const env = getAppEnv();

  if (env === "dev") {
    return createMockCommentTargetLookup();
  }

  throw new NotImplementedError(
    `CommentTargetLookup not implemented for env="${env}". Expected until Supabase lookup is added.`
  );
}

