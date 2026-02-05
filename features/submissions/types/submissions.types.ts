import type { AipStatus, ISODateTime, UUID } from "@/lib/contracts/databasev2";

export type AipSubmissionItem = {
  id: UUID;
  title: string;
  year: number;
  status: AipStatus;
  scope: "barangay" | "city" | "municipality";
  barangayName?: string | null;
  uploadedAt: ISODateTime;
  reviewerName?: string | null;
};

