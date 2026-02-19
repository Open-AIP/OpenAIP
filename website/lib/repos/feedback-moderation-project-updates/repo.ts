import { selectRepo } from "@/lib/repos/_shared/selector";
import { createMockFeedbackModerationProjectUpdatesRepo } from "./repo.mock";
import type {
  ModerationActionRecord,
  ProjectRecord,
  AipRecord,
  ProfileRecord,
  CityRecord,
  BarangayRecord,
  MunicipalityRecord,
  ProjectUpdateRecord,
} from "./types";

export type FeedbackModerationProjectUpdatesSeed = {
  updates: ProjectUpdateRecord[];
  actions: ModerationActionRecord[];
  lguMap: {
    projects: ProjectRecord[];
    aips: AipRecord[];
    profiles: ProfileRecord[];
    cities: CityRecord[];
    barangays: BarangayRecord[];
    municipalities: MunicipalityRecord[];
  };
};

export interface FeedbackModerationProjectUpdatesRepo {
  getSeedData(): FeedbackModerationProjectUpdatesSeed;
}

export function getFeedbackModerationProjectUpdatesRepo(): FeedbackModerationProjectUpdatesRepo {
  return selectRepo({
    label: "FeedbackModerationProjectUpdatesRepo",
    mock: () => createMockFeedbackModerationProjectUpdatesRepo(),
    supabase: () => {
      throw new Error("FeedbackModerationProjectUpdatesRepo is not implemented for Supabase yet.");
    },
  });
}
