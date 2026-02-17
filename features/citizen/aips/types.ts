import type {
  FeedbackItem as CitizenFeedbackItem,
  FeedbackUser as CitizenFeedbackUser,
} from "@/lib/repos/feedback/citizen";
import type {
  AipAccountability,
  AipDetails,
  AipListItem,
  AipProjectRow,
  AipProjectSector,
  AccountabilityPerson,
  CommentPlaceholder,
} from "@/lib/types/viewmodels/citizen-aips.vm";

export type { AipListItem, AipProjectSector, AipProjectRow, AccountabilityPerson, AipAccountability, CommentPlaceholder, AipDetails };

export type FeedbackItem = CitizenFeedbackItem;
export type FeedbackUser = CitizenFeedbackUser;
