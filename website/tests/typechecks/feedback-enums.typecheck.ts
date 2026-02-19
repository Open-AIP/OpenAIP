import type { FeedbackKind, FeedbackTargetType } from "@/lib/contracts/databasev2";
import type { FeedbackItem } from "@/lib/repos/feedback/repo";

type IsEqual<A, B> =
  (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;

export type _FeedbackItemKindIsDbv2Enum = Assert<IsEqual<FeedbackItem["kind"], FeedbackKind>>;
export type _FeedbackItemTargetIsDbv2Enum = Assert<
  IsEqual<FeedbackItem["targetType"], FeedbackTargetType>
>;

