export type AipStatus = "Draft" | "Under Review" | "For Revision" | "Published";

export type AipRecord = {
  id: string;
  title: string;
  description: string;
  year: number;
  budget: number; // store as number; format on UI
  uploadedAt: string; // ISO or readable string
  publishedAt?: string; // optional
  status: AipStatus;
};

export type AipUploader = {
  name: string;
  role: string;
  uploadDate: string;
  budgetAllocated: number;
};

export type AipDetail = AipRecord & {
  fileName: string;
  pdfUrl?: string; // optional mock/real link
  summaryText: string;
  detailedBullets: string[];
  tablePreviewUrl?: string; // image placeholder for now
  sectors: string[];
  uploader: AipUploader;
  status: AipStatus;
  feedback?: string; // optional; provided when status is "For Revision"
};