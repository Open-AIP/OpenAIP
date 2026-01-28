import type { AipHeader } from "../types";

export const AIPS_TABLE: AipHeader[] = [
  {
    id: "aip-2026-mamadid",
    scope: "barangay",
    barangayName: "Brgy. Mamadid",
    title: "Annual Investment Program",
    description: "Development and improvement of barangay infrastructure including roads, bridges...",
    year: 2026,
    budget: 5800000,
    uploadedAt: "2026-01-15",
    status: "pending_review",
    fileName: "Annual_Investment_Plan_2026.pdf",
    pdfUrl: "/mock/aip-2026.pdf",
    tablePreviewUrl: "/mock/aip-table.png",
    summaryText: "Development and improvement of barangay infrastructure including roads, bridges...",
    detailedBullets: ["Road Concreting and Rehabilitation - 2.5km", "Drainage System Improvements"],
    sectors: ["All", "Infrastructure", "Health", "Education", "Social Welfare", "Environment"],
    uploader: {
      name: "Maria Santos",
      role: "Infrastructure Head",
      uploadDate: "January 15, 2026",
      budgetAllocated: 5800000,
    },
    feedback: "Please provide more detailed cost breakdown...",
  },
];
