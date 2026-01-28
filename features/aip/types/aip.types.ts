export type LguScope = "barangay" | "city";

export type AipStatus =
  | "draft"
  | "pending_review"
  | "under_review"
  | "for_revision"
  | "published";

export type AipHeader = {
  id: string; // aipId
  scope: LguScope;
  barangayName?: string;

  title: string;
  description: string;
  year: number;
  budget: number;

  uploadedAt: string;
  publishedAt?: string;

  status: AipStatus;

  fileName: string;
  pdfUrl: string;
  tablePreviewUrl?: string;

  summaryText?: string;
  detailedBullets?: string[];

  sectors: string[];

  uploader: {
    name: string;
    role: string;
    uploadDate: string;
    budgetAllocated: number;
  };

  feedback?: string;
};
