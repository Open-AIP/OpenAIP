/*
import type { AipDetail } from "@/types";

export type LguScope = "barangay" | "city";


export const MOCK_AIPS: Array<AipDetail & { scope: LguScope; barangayName?: string }> = [
  // =========================
  // BARANGAY
  // =========================
  {
    scope: "barangay",
    barangayName: "Brgy. Mamadid",
    id: "aip-2026-infra",
    title: "Annual Investment Program",
    description:
      "Development and improvement of barangay infrastructure including roads, bridges, and community facilities to support community growth.",
    year: 2026,
    budget: 5800000,
    uploadedAt: "2026-01-15",
    status: "Pending Review",
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
      uploadDate: "January 15, 2026",
      budgetAllocated: 5800000,
    },


    healthProjects: [
      {
        id: "SS-2026-001",
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
        imageUrl: "/default/default-no-image.jpg",
        updates: [],
      },
      {
        id: "SS-2026-002",
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
        imageUrl: "/mock/health/health1.jpg",
        updates: [],
      },
    ],

   
    infrastructureProjects: [
      {
        id: "GS-2026-001",
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
        imageUrl: "/mock/health/health1.jpg",
      },
      {
        id: "GS-2026-002",
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
        imageUrl: "/default/default-no-image.jpg",
      },
    ],
  },

  {
    scope: "barangay",
    barangayName: "Brgy. Pulo",
    id: "aip-2025-published",
    title: "Annual Investment Program",
    description:
      "Comprehensive program focusing on roads, community facilities, and essential services to improve daily living conditions.",
    year: 2025,
    budget: 1500000,
    uploadedAt: "2025-12-20",
    publishedAt: "January 10, 2026",
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
        id: "SS-2025-001",
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
        imageUrl: "/default/default-no-image.jpg",
        updates: [
          {
            id: "SS-2025-001-U1",
            title: "Medical mission successfully completed",
            date: "December 15, 2025",
            description:
              "Completed quarterly medical mission with free consultations, laboratory screening, and medicine distribution. Exceeded target participation.",
            attendanceCount: 850,
            progressPercent: 100,
            photoUrls: ["/mock/updates/medical-1.jpg", "/mock/updates/medical-2.jpg", "/mock/updates/medical-3.jpg"],
          },
          {
            id: "SS-2025-001-U2",
            title: "Medical supplies and equipment prepared",
            date: "December 10, 2025",
            description:
              "Organized medical supplies, set up consultation booths, and coordinated with volunteer doctors and nurses.",
            attendanceCount: 0,
            progressPercent: 80,
            photoUrls: ["/mock/updates/prep-1.jpg"],
          },
        ],
      },
    ],

    infrastructureProjects: [
      {
        id: "GS-2025-001",
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
        imageUrl: "/default/default-no-image.jpg",
        updates: [
          {
            id: "GS-2025-001-U1",
            title: "Project completion and inspection",
            date: "November 15, 2025",
            description:
              "Successfully completed all drainage clearing and mitigation works. Final inspection passed with commendations for quality of work and timely completion.",
            progressPercent: 100,
            photoUrls: ["/mock/updates/drainage-complete-1.jpg", "/mock/updates/drainage-complete-2.jpg"],
          },
          {
            id: "GS-2025-001-U2",
            title: "Canal rehabilitation completed",
            date: "October 25, 2025",
            description:
              "Finished rehabilitation of all primary drainage canals. Installed new concrete lining and improved water flow capacity by 40%.",
            progressPercent: 85,
            photoUrls: ["/mock/updates/drainage-rehab.jpg"],
          },
          {
            id: "GS-2025-001-U3",
            title: "Debris clearing phase completed",
            date: "September 10, 2025",
            description:
              "Cleared approximately 2 tons of debris and sediment from drainage canals. Improved water flow observed in affected areas.",
            progressPercent: 50,
            photoUrls: ["/mock/updates/drainage-clearing.jpg"],
          },
        ],
      },
    ],
  },

  {
    scope: "barangay",
    barangayName: "Brgy. Banaybanay",
    id: "aip-2024-under-review",
    title: "Annual Investment Program",
    description:
      "Comprehensive health program aimed at enhancing healthcare services and community wellness initiatives for all barangay residents.",
    year: 2024,
    budget: 2500000,
    uploadedAt: "2024-11-30",
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
        id: "SS-2024-001",
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
        imageUrl: "/default/default-no-image.jpg",
        updates: [],
      },
    ],

    infrastructureProjects: [],
  },

  {
    scope: "barangay",
    barangayName: "Brgy. San Isidro",
    id: "aip-2023-published",
    title: "Annual Investment Program",
    description:
      "Infrastructure development and social services expansion to enhance barangay facilities and resident welfare.",
    year: 2023,
    budget: 3200000,
    uploadedAt: "2023-10-15",
    publishedAt: "November 10, 2023",
    status: "Published",

    fileName: "Annual_Investment_Plan_2023.pdf",
    pdfUrl: "/mock/aip-2023.pdf",
    summaryText:
      "Infrastructure development and social services expansion to enhance barangay facilities and resident welfare.",
    detailedBullets: [
      "Basketball court construction and sports facility upgrades",
      "Senior citizen wellness program",
      "Street lighting installation phase 2",
      "Barangay hall renovation and expansion",
    ],
    tablePreviewUrl: "/mock/aip-table.png",
    sectors: ["All", "Infrastructure", "Health", "Social Welfare"],
    uploader: {
      name: "Roberto Cruz",
      role: "Barangay Chairman",
      uploadDate: "October 15, 2023",
      budgetAllocated: 3200000,
    },

    healthProjects: [
      {
        id: "SS-2023-001",
        year: 2023,
        month: "August",
        title: "Senior Citizen Wellness Program",
        description:
          "Comprehensive wellness program providing health checkups, exercise activities, and social engagement for senior citizens.",
        totalTargetParticipants: 600,
        targetParticipants: "Senior Citizens 60 years and above",
        implementingOffice: "Barangay Social Welfare Office",
        budgetAllocated: 280000,
        status: "Completed",
        imageUrl: "/default/default-no-image.jpg",
        updates: [
          {
            id: "SS-2023-001-U1",
            title: "Program successfully completed with high satisfaction",
            date: "December 18, 2023",
            description:
              "Concluded the senior wellness program with 650 participants. Conducted health screenings, exercise classes, and social activities throughout the program period.",
            attendanceCount: 650,
            progressPercent: 100,
            photoUrls: ["/mock/updates/senior-1.jpg", "/mock/updates/senior-2.jpg"],
          },
          {
            id: "SS-2023-001-U2",
            title: "Weekly exercise and health monitoring sessions",
            date: "October 20, 2023",
            description:
              "Ongoing weekly exercise sessions and monthly health monitoring for enrolled senior citizens. Positive feedback from participants.",
            attendanceCount: 580,
            progressPercent: 70,
            photoUrls: ["/mock/updates/senior-exercise.jpg"],
          },
          {
            id: "SS-2023-001-U3",
            title: "Initial enrollment and health screening",
            date: "August 15, 2023",
            description:
              "Completed enrollment of senior citizens and conducted baseline health screening. Set up program schedule and volunteer coordination.",
            attendanceCount: 600,
            progressPercent: 30,
          },
        ],
      },
    ],

    infrastructureProjects: [
      {
        id: "GS-2023-001",
        year: 2023,
        startDate: "2023-03-15",
        targetCompletionDate: "2023-09-30",
        title: "Basketball Court Construction and Renovation",
        description:
          "Construction of new basketball court and renovation of existing sports facilities for youth development and community recreation.",
        implementingOffice: "Barangay Engineering Office",
        fundingSource: "20% Development Fund + Grants",
        contractorName: "Sports Facilities Builders Inc.",
        contractCost: 1500000,
        status: "Completed",
        imageUrl: "/default/default-no-image.jpg",
        updates: [
          {
            id: "GS-2023-001-U1",
            title: "Grand inauguration and turnover",
            date: "September 30, 2023",
            description:
              "Official inauguration ceremony held with barangay officials and community members. Court is now fully operational and open for public use.",
            progressPercent: 100,
            photoUrls: ["/mock/updates/basketball-inaug-1.jpg", "/mock/updates/basketball-inaug-2.jpg"],
          },
          {
            id: "GS-2023-001-U2",
            title: "Court surfacing and line marking completed",
            date: "September 15, 2023",
            description:
              "Completed installation of high-quality synthetic sports flooring and professional court line markings. Installed basketball hoops and backboards.",
            progressPercent: 90,
            photoUrls: ["/mock/updates/basketball-surfacing.jpg"],
          },
          {
            id: "GS-2023-001-U3",
            title: "Perimeter fence and lighting installed",
            date: "August 20, 2023",
            description:
              "Installed 4-meter high perimeter fence for safety and security. LED floodlights installed to enable evening games and activities.",
            progressPercent: 70,
            photoUrls: ["/mock/updates/basketball-fence.jpg"],
          },
          {
            id: "GS-2023-001-U4",
            title: "Foundation and concrete work finished",
            date: "July 10, 2023",
            description:
              "Completed excavation and laying of reinforced concrete foundation. Court base is level and ready for surfacing installation.",
            progressPercent: 45,
            photoUrls: ["/mock/updates/basketball-foundation.jpg"],
          },
        ],
      },
    ],
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

    healthProjects: [
      {
        id: "SS-2026-003",
        year: 2026,
        month: "February",
        title: "City Hospital Emergency Room Expansion",
        description:
          "Expansion and modernization of city hospital emergency room facilities to accommodate increased patient volume and improve emergency response time.",
        totalTargetParticipants: 50000,
        targetParticipants: "All City Residents",
        implementingOffice: "City Health Office",
        budgetAllocated: 15000000,
        status: "Ongoing",
        imageUrl: "/default/default-no-image.jpg",
        updates: [
          {
            id: "SS-2026-003-U1",
            title: "Construction phase initiated",
            date: "February 10, 2026",
            description:
              "Began construction of the new emergency room wing. Foundation work completed and structural framework in progress.",
            attendanceCount: 0,
            progressPercent: 25,
            photoUrls: ["/mock/updates/hospital-construction.jpg"],
          },
        ],
      },
    ],
    infrastructureProjects: [
      {
        id: "GS-2026-003",
        year: 2026,
        startDate: "2026-01-20",
        targetCompletionDate: "2026-12-15",
        title: "Main Avenue Road Widening Project",
        description:
          "Widening of main city avenue to reduce traffic congestion and improve traffic flow. Includes installation of modern traffic management systems.",
        implementingOffice: "City Engineering Office",
        fundingSource: "City Budget + National Grant",
        contractorName: "Metro Infrastructure Corp.",
        contractCost: 45000000,
        status: "Ongoing",
        imageUrl: "/default/default-no-image.jpg",
        updates: [
          {
            id: "GS-2026-003-U1",
            title: "Phase 1 excavation and utility relocation",
            date: "January 22, 2026",
            description:
              "Completed excavation for the first 500-meter section. Relocated underground utilities including water pipes and electrical cables to accommodate road widening.",
            progressPercent: 15,
            photoUrls: ["/mock/updates/road-excavation-1.jpg", "/mock/updates/road-excavation-2.jpg"],
          },
        ],
      },
    ],
  },

  {
    scope: "city",
    id: "city-aip-2025",
    title: "City Annual Investment Program",
    description:
      "Strategic investment program focusing on urban development, public services enhancement, and digital infrastructure.",
    year: 2025,
    budget: 98000000,
    uploadedAt: "2025",
    publishedAt: "December 15, 2025",
    status: "Published",

    fileName: "City_AIP_2025.pdf",
    pdfUrl: "/mock/city-aip-2025.pdf",
    summaryText:
      "Strategic investment program focusing on urban development, public services enhancement, and digital infrastructure.",
    detailedBullets: [
      "Public market modernization and sanitation upgrades",
      "City-wide free Wi-Fi implementation",
      "Parks and recreation facilities development",
      "Public school infrastructure improvements",
    ],
    tablePreviewUrl: "/mock/aip-table.png",
    sectors: ["All", "Infrastructure", "Education", "Digital Services"],
    uploader: {
      name: "City Planning Office",
      role: "City Official",
      uploadDate: "November 20, 2025",
      budgetAllocated: 98000000,
    },

    healthProjects: [],
    infrastructureProjects: [
      {
        id: "GS-2025-002",
        year: 2025,
        startDate: "2025-04-01",
        targetCompletionDate: "2025-11-30",
        title: "Public Market Modernization",
        description:
          "Complete renovation and modernization of the city public market with improved sanitation, ventilation, and vendor facilities.",
        implementingOffice: "City Engineering Office",
        fundingSource: "City Development Fund",
        contractorName: "Urban Builders Co.",
        contractCost: 28000000,
        status: "Completed",
        imageUrl: "/default/default-no-image.jpg",
        updates: [
          {
            id: "GS-2025-002-U1",
            title: "Market reopening and vendor relocation",
            date: "November 30, 2025",
            description:
              "Successfully completed all modernization works. Market officially reopened with improved facilities. All 250 vendors relocated back to their new stalls.",
            progressPercent: 100,
            photoUrls: ["/mock/updates/market-opening-1.jpg", "/mock/updates/market-opening-2.jpg", "/mock/updates/market-opening-3.jpg"],
          },
          {
            id: "GS-2025-002-U2",
            title: "Final installations and testing",
            date: "November 15, 2025",
            description:
              "Installed all mechanical and electrical systems including new ventilation, fire suppression, and security CCTV. Conducted safety and systems testing.",
            progressPercent: 95,
            photoUrls: ["/mock/updates/market-systems.jpg"],
          },
          {
            id: "GS-2025-002-U3",
            title: "Vendor stall construction completed",
            date: "October 10, 2025",
            description:
              "Finished construction of all 250 modernized vendor stalls with improved counters, storage, and sanitation facilities. Painted and numbered all stalls.",
            progressPercent: 75,
            photoUrls: ["/mock/updates/market-stalls.jpg"],
          },
          {
            id: "GS-2025-002-U4",
            title: "Structural renovation phase completed",
            date: "August 20, 2025",
            description:
              "Completed major structural renovations including roof replacement, floor resurfacing, and wall repairs. Improved natural lighting with new skylight installations.",
            progressPercent: 50,
            photoUrls: ["/mock/updates/market-structure.jpg"],
          },
          {
            id: "GS-2025-002-U5",
            title: "Demolition and temporary vendor relocation",
            date: "May 5, 2025",
            description:
              "Completed demolition of old facilities and structures. Temporarily relocated all vendors to nearby temporary market area to allow for construction.",
            progressPercent: 20,
            photoUrls: ["/mock/updates/market-demo.jpg"],
          },
        ],
      },
    ],
  },
];

//For Filtering AIP Years and Project Years in the UI
export function getAipYears(items: Array<{ year: number }>) {
  return Array.from(new Set(items.map((x) => x.year))).sort((a, b) => b - a);
}

export function getProjectYears(items: Array<{ year: number }>) {
  return Array.from(new Set(items.map((x) => x.year))).sort((a, b) => b - a);
}

export function getHealthProjectById(id: string) {
  // Search through all AIPs to find the health project
  for (const aip of MOCK_AIPS) {
    const project = aip.healthProjects?.find((project) => project.id === id);
    if (project) {
      return project;
    }
  }
  return undefined;
}

export function getInfrastructureProjectById(id: string) {
  // Search through all AIPs to find the infrastructure project
  for (const aip of MOCK_AIPS) {
    const project = aip.infrastructureProjects?.find((project) => project.id === id);
    if (project) {
      return project;
    }
  }
  return undefined;
}

// Helper to get all health projects from a specific scope
export function getAllHealthProjects(scope: LguScope = "barangay") {
  return MOCK_AIPS
    .filter((aip) => aip.scope === scope)
    .flatMap((aip) => aip.healthProjects || []);
}

// Helper to get all infrastructure projects from a specific scope
export function getAllInfrastructureProjects(scope: LguScope = "barangay") {
  return MOCK_AIPS
    .filter((aip) => aip.scope === scope)
    .flatMap((aip) => aip.infrastructureProjects || []);
}
*/