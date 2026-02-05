import type { AipSubmissionItem } from "../types/submissions.types";
import { AIP_IDS } from "@/features/shared/mock/id-contract";

export const AIP_SUBMISSIONS_MOCK: AipSubmissionItem[] = [
  {
    id: AIP_IDS.barangay_mamadid_2026,
    scope: "barangay",
    barangayName: "Brgy. Mamadid",
    title: "Annual Investment Program 2026",
    year: 2026,
    status: "pending_review",
    reviewerName: null,
    uploadedAt: "2026-01-20T08:10:00.000Z",
  },
  {
    id: AIP_IDS.barangay_poblacion_2026,
    scope: "barangay",
    barangayName: "Brgy. Poblacion",
    title: "Annual Investment Program 2026",
    year: 2026,
    status: "published",
    reviewerName: "City Official",
    uploadedAt: "2026-01-10T10:30:00.000Z",
  },
  {
    id: AIP_IDS.barangay_sanisidro_2026,
    scope: "barangay",
    barangayName: "Brgy. San Isidro",
    title: "Annual Investment Program 2026",
    year: 2026,
    status: "for_revision",
    reviewerName: "City Official",
    uploadedAt: "2026-01-18T13:05:00.000Z",
  },
  {
    id: AIP_IDS.barangay_santamaria_2026,
    scope: "barangay",
    barangayName: "Brgy. Santa Maria",
    title: "Annual Investment Program 2026",
    year: 2026,
    status: "draft",
    reviewerName: null,
    uploadedAt: "2026-01-12T09:15:00.000Z",
  },
  {
    id: AIP_IDS.barangay_mamadid_2025,
    scope: "barangay",
    barangayName: "Brgy. Mamadid",
    title: "Annual Investment Program 2025",
    year: 2025,
    status: "published",
    reviewerName: "City Official",
    uploadedAt: "2025-01-20T11:42:00.000Z",
  },
];

