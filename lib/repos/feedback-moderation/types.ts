import type {
  ActivityLogRow,
  AipRow,
  FeedbackRow,
  ProfileRow,
  ProjectRow,
  RoleType,
} from "@/lib/contracts/databasev2";

export type Dbv2FeedbackRow = FeedbackRow;
export type Dbv2ActivityLogRow = ActivityLogRow;
export type Dbv2ProfileRow = ProfileRow;
export type Dbv2AipRow = AipRow;
export type Dbv2ProjectRow = ProjectRow;

export type Dbv2CityRow = {
  id: string;
  region_id: string;
  province_id: string | null;
  psgc_code: string;
  name: string;
  is_independent: boolean;
  is_active: boolean;
  created_at: string;
};

export type Dbv2BarangayRow = {
  id: string;
  city_id: string | null;
  municipality_id: string | null;
  psgc_code: string;
  name: string;
  is_active: boolean;
  created_at: string;
};

export type Dbv2MunicipalityRow = {
  id: string;
  province_id: string;
  psgc_code: string;
  name: string;
  is_active: boolean;
  created_at: string;
};

export type FeedbackModerationDataset = {
  feedback: Dbv2FeedbackRow[];
  activity: Dbv2ActivityLogRow[];
  profiles: Dbv2ProfileRow[];
  aips: Dbv2AipRow[];
  projects: Dbv2ProjectRow[];
  cities: Dbv2CityRow[];
  barangays: Dbv2BarangayRow[];
  municipalities: Dbv2MunicipalityRow[];
};

export type FeedbackModerationActionInput = {
  feedbackId: string;
  reason: string;
  violationCategory?: string | null;
  actorId: string;
  actorRole: RoleType | null;
  scope?: {
    region_id?: string | null;
    province_id?: string | null;
    city_id?: string | null;
    municipality_id?: string | null;
    barangay_id?: string | null;
  };
};

export type FeedbackModerationRepo = {
  listDataset: () => Promise<FeedbackModerationDataset>;
  hideFeedback: (input: FeedbackModerationActionInput) => Promise<FeedbackModerationDataset>;
  unhideFeedback: (input: FeedbackModerationActionInput) => Promise<FeedbackModerationDataset>;
};
