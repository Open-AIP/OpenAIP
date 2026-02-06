import { InfrastructureProject, HealthProject } from "./project";

import type { AipStatus } from "@/lib/contracts/databasev2";

export type { AipStatus } from "@/lib/contracts/databasev2";

export type AipRecord = {
  id: string;
  title: string;
  description: string;
  year: number;
  budget: number;
  uploadedAt: string;
  publishedAt?: string;
  status: AipStatus;
  scope: "city" | "barangay";
  barangayName?: string;
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
  feedback?: string; // optional; provided when status is "For Revision"
  healthProjects?: HealthProject[];
  infrastructureProjects?: InfrastructureProject[];
};
