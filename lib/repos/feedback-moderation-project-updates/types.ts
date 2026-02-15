import type {
  ActivityLogRow,
  AipRow,
  ProfileRow,
  ProjectRow,
  UUID,
  ISODateTime,
} from "@/lib/contracts/databasev2";

export type ProjectUpdateRecord = ActivityLogRow;
export type ModerationActionRecord = ActivityLogRow;
export type ProjectUpdateMediaRecord = ActivityLogRow;

export type AipRecord = AipRow;
export type ProjectRecord = ProjectRow;
export type ProfileRecord = ProfileRow;

export type CityRecord = {
  id: UUID;
  region_id: UUID;
  province_id: UUID | null;
  psgc_code: string;
  name: string;
  is_independent: boolean;
  is_active: boolean;
  created_at: ISODateTime;
};

export type BarangayRecord = {
  id: UUID;
  city_id: UUID | null;
  municipality_id: UUID | null;
  psgc_code: string;
  name: string;
  is_active: boolean;
  created_at: ISODateTime;
};

export type MunicipalityRecord = {
  id: UUID;
  province_id: UUID;
  psgc_code: string;
  name: string;
  is_active: boolean;
  created_at: ISODateTime;
};

export type ProjectUpdateStatus = "Active" | "Removed" | "Flagged";
export type ProjectUpdateType = "Update" | "Photo";

export type ProjectUpdateRowModel = {
  id: string;
  previewUrl: string | null;
  title: string;
  caption: string | null;
  lguName: string;
  uploadedBy: string;
  type: ProjectUpdateType;
  status: ProjectUpdateStatus;
  date: string;
};

export type ProjectUpdateDetailsModel = {
  id: string;
  projectTitle: string;
  lguName: string;
  updateTitle: string;
  updateCaption: string | null;
  updateContent: string;
  progressPercent: number | null;
  attendanceCount: number | null;
  attachments: string[];
  uploadedByName: string;
  uploadedByPosition: string | null;
  uploadedByEmail: string | null;
  uploadedAt: string;
  status: ProjectUpdateStatus;
  removedReason: string | null;
  violationCategory: string | null;
};
