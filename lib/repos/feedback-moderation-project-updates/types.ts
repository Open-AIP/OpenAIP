import type {
  ActivityLogRow,
  AipRow,
  BarangayRow,
  CityRow,
  MunicipalityRow,
  ProfileRow,
  ProjectRow,
} from "@/lib/contracts/databasev2";

export type ProjectUpdateRecord = ActivityLogRow;
export type ModerationActionRecord = ActivityLogRow;
export type ProjectUpdateMediaRecord = ActivityLogRow;

export type AipRecord = AipRow;
export type ProjectRecord = ProjectRow;
export type ProfileRecord = ProfileRow;

export type CityRecord = CityRow;
export type BarangayRecord = BarangayRow;
export type MunicipalityRecord = MunicipalityRow;

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
