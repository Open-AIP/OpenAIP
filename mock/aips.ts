import type { AipDetail } from "@/types";

export type LguScope = "barangay" | "city";

/**
 * SINGLE SOURCE OF TRUTH for all AIP + Projects mock data.
 * Use this for:
 * - /barangay/aips list + detail
 * - /barangay/projects/health (derived from this)
 * - /barangay/projects/infrastructure (derived from this)
 * - /city equivalents later
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
    feedback:
      "Please provide more detailed cost breakdown for the Multi-purpose Community Hall Construction. Additionally, clarify the timeline for the Road Concreting project and ensure alignment with the city's infrastructure masterplan.",

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

    // ✅ Health Projects for this AIP year
    healthProjects: [
      {
        id: "hp-2026-vaccination",
        year: 2026,
        month: "January",
        title: "Community Vaccination Program",
        description:
          "Comprehensive vaccination drive targeting all eligible residents including children, senior citizens, and immunocompromised individuals.",
        totalTargetParticipants: 5000,
        targetParticipants: "All Barangay Residents",
        implementingOffice: "Barangay Health Office",
        budgetAllocated: 250000,
        status: "Ongoing",
        imageUrl: "/mock/health/health1.jpg",
      },
      {
        id: "hp-2026-mch",
        year: 2026,
        month: "February",
        title: "Maternal and Child Health Program",
        description:
          "Prenatal and postnatal care services for pregnant women and nutritional support for children under 5 years old.",
        totalTargetParticipants: 320,
        targetParticipants: "Pregnant Women and Children 0–5 years",
        implementingOffice: "Barangay Health Office",
        budgetAllocated: 180000,
        status: "Planning",
        imageUrl: "/mock/health/health2.jpg",
      },
    ],

    // ✅ Infrastructure Projects for this AIP year (matches your Add Information form)
    infrastructureProjects: [
      {
        id: "ip-2026-road-rehab",
        year: 2026,
        startDate: "2026-01-10",
        targetCompletionDate: "2026-05-30",
        title: "Road Concreting and Rehabilitation (2.5km)",
        description:
          "Concrete paving and rehabilitation of priority barangay roads to improve accessibility and reduce travel time.",
        implementingOffice: "Barangay Engineering Office",
        fundingSource: "20% Development Fund",
        contractorName: "ABC Construction Services",
        contractCost: 2200000,
        status: "Ongoing",
        imageUrl: "/mock/infra/road.jpg",
      },
      {
        id: "ip-2026-community-hall",
        year: 2026,
        startDate: "2026-02-05",
        targetCompletionDate: "2026-10-15",
        title: "Multi-purpose Community Hall Construction",
        description:
          "Construction of a multi-purpose community hall for barangay programs, meetings, and community events.",
        implementingOffice: "Barangay Engineering Office",
        fundingSource: "Local Funds / Grants",
        contractorName: "Delta Builders Corp.",
        contractCost: 1800000,
        status: "Planning",
        imageUrl: "/mock/infra/community-hall.jpg",
      },
    ],
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

    healthProjects: [
      {
        id: "hp-2025-med-mission",
        year: 2025,
        month: "December",
        title: "Quarterly Medical Mission",
        description:
          "Free consultations, basic laboratory screening, and medicine distribution for priority residents.",
        totalTargetParticipants: 800,
        targetParticipants: "Senior Citizens and Priority Households",
        implementingOffice: "Barangay Health Office",
        budgetAllocated: 300000,
        status: "Completed",
        imageUrl: "/mock/health/health3.jpg",
      },
    ],

    infrastructureProjects: [
      {
        id: "ip-2025-drainage",
        year: 2025,
        startDate: "2025-08-01",
        targetCompletionDate: "2025-11-15",
        title: "Drainage Clearing and Mitigation Works",
        description:
          "Clearing and rehabilitation of drainage canals to reduce flooding incidents during rainy season.",
        implementingOffice: "Barangay Engineering Office",
        fundingSource: "Local Funds",
        contractorName: "GreenFlow Services",
        contractCost: 450000,
        status: "Completed",
        imageUrl: "/mock/infra/drainage.jpg",
      },
    ],
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

    healthProjects: [
      {
        id: "hp-2024-nutrition",
        year: 2024,
        month: "July",
        title: "Barangay Nutrition & Feeding Support",
        description:
          "Targeted feeding assistance and nutrition education sessions to reduce malnutrition indicators among children.",
        totalTargetParticipants: 450,
        targetParticipants: "Children (0–12) and At-risk Families",
        implementingOffice: "Barangay Health Office",
        budgetAllocated: 120000,
        status: "Ongoing",
        imageUrl: "/mock/health/health4.jpg",
      },
    ],

    infrastructureProjects: [],
  },

  // =========================
  // CITY
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

    // city projects optional; keep empty until needed
    healthProjects: [],
    infrastructureProjects: [],
  },
];

export function getAipYears(items: Array<{ year: number }>) {
  return Array.from(new Set(items.map((x) => x.year))).sort((a, b) => b - a);
}

export function getProjectYears(items: Array<{ year: number }>) {
  return Array.from(new Set(items.map((x) => x.year))).sort((a, b) => b - a);
}
