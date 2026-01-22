import type { AipDetail } from "@/types";

export type LguScope = "barangay" | "city";

/**
 * SINGLE SOURCE OF TRUTH for all AIP mock data.
 * Use this for both:
 * - /barangay/aips list
 * - /barangay/aips/[aipId] detail
 * - /city/aips list
 * - /city/aips/[aipId] detail (if you add later)
 */
export const MOCK_AIPS: Array<AipDetail & { scope: LguScope }> = [
  // =========================
  // BARANGAY
  // =========================
  {
    scope: "barangay",
    id: "aip-2026-infra",
    title: "Annual Investment Program",
    description:
      "Development and improvement of barangay infrastructure including roads, bridges, and community facilities to support community growth.",
    year: 2026,
    budget: 5800000,
    uploadedAt: "2026",
    status: "For Revision",

    fileName: "Annual_Investment_Plan_2026.pdf",
    pdfUrl: "/mock/aip-2026.pdf",
    summaryText:
      "Development and improvement of barangay infrastructure including roads, bridges, and community facilities to support community growth.",
    detailedBullets: [
      "Road Concreting and Rehabilitation - 2.5km",
      "Drainage System Improvements",
      "Multi-purpose Community Hall Construction",
      "Streetlight Installation and Maintenance",
      "Basketball Court Renovation",
    ],
    tablePreviewUrl: "/mock/aip-table.png",
    sectors: ["All", "Infrastructure", "Health", "Education", "Social Welfare", "Environment"],
    uploader: {
      name: "Maria Santos",
      role: "Infrastructure Head",
      uploadDate: "January 25, 2026",
      budgetAllocated: 5800000,
    },
  },
  {
    scope: "barangay",
    id: "aip-2025-published",
    title: "Annual Investment Program",
    description:
      "Comprehensive program focusing on roads, community facilities, and essential services to improve daily living conditions.",
    year: 2025,
    budget: 1500000,
    uploadedAt: "2026",
    publishedAt: "January 15, 2026",
    status: "Published",

    fileName: "Annual_Investment_Plan_2025.pdf",
    pdfUrl: "/mock/aip-2025.pdf",
    summaryText:
      "Comprehensive program focusing on roads, community facilities, and essential services to improve daily living conditions.",
    detailedBullets: [
      "Road patching and maintenance program",
      "Barangay health station supplies",
      "Community facility repairs and upgrades",
      "Drainage clearing and mitigation works",
    ],
    tablePreviewUrl: "/mock/aip-table.png",
    sectors: ["All", "Infrastructure", "Health", "Education"],
    uploader: {
      name: "Juan Dela Cruz",
      role: "Barangay Official",
      uploadDate: "December 20, 2025",
      budgetAllocated: 1500000,
    },
  },
  {
    scope: "barangay",
    id: "aip-2024-under-review",
    title: "Annual Investment Program",
    description:
      "Comprehensive health program aimed at enhancing healthcare services and community wellness initiatives for all barangay residents.",
    year: 2024,
    budget: 2500000,
    uploadedAt: "2026",
    status: "Under Review",

    fileName: "Annual_Investment_Plan_2024.pdf",
    pdfUrl: "/mock/aip-2024.pdf",
    summaryText:
      "Comprehensive health program aimed at enhancing healthcare services and community wellness initiatives for all barangay residents.",
    detailedBullets: [
      "Barangay medical mission (quarterly)",
      "Maternal and child health support program",
      "Nutrition assistance and feeding program",
      "Health station equipment and supplies",
    ],
    tablePreviewUrl: "/mock/aip-table.png",
    sectors: ["All", "Health", "Social Welfare"],
    uploader: {
      name: "Ana Reyes",
      role: "Health Coordinator",
      uploadDate: "November 30, 2024",
      budgetAllocated: 2500000,
    },
  },

  // =========================
  // CITY (optional now; ready later)
  // =========================
  {
    scope: "city",
    id: "city-aip-2026",
    title: "City Annual Investment Program",
    description:
      "City-wide investment plan covering multi-sector programs and flagship infrastructure projects for inclusive growth.",
    year: 2026,
    budget: 125000000,
    uploadedAt: "2026",
    status: "Published",
    publishedAt: "February 01, 2026",

    fileName: "City_AIP_2026.pdf",
    pdfUrl: "/mock/city-aip-2026.pdf",
    summaryText:
      "City-wide investment plan covering multi-sector programs and flagship infrastructure projects for inclusive growth.",
    detailedBullets: [
      "Major road widening and traffic decongestion program",
      "City health services expansion and facility upgrades",
      "Digital governance modernization initiatives",
      "Disaster risk reduction and resilience projects",
    ],
    tablePreviewUrl: "/mock/aip-table.png",
    sectors: ["All", "Infrastructure", "Health", "Education", "DRRM", "Digital Governance"],
    uploader: {
      name: "City Planning Office",
      role: "City Official",
      uploadDate: "January 10, 2026",
      budgetAllocated: 125000000,
    },
  },
];

export function getAipYears(items: Array<{ year: number }>) {
  return Array.from(new Set(items.map((x) => x.year))).sort((a, b) => b - a);
}
