/**
 * Mock AIP Generator Service
 *
 * Generates mock AIP data for uploaded files to simulate the upload process.
 */

import type { AipHeader, AipProjectRow } from "./repo";
import type { LguScope } from "./repo";

const SAMPLE_PROJECTS = [
  {
    sector: "General Sector" as const,
    descriptions: [
      "Road Concreting and Rehabilitation",
      "Multi-purpose Hall Construction",
      "Basketball Court Renovation",
      "Drainage System Improvements",
      "Bridge Construction and Repair",
    ],
  },
  {
    sector: "Social Sector" as const,
    descriptions: [
      "Health Center Expansion",
      "Day Care Center Construction",
      "Senior Citizens Facility",
      "Vaccination Drive Program",
      "Medical Equipment Procurement",
    ],
  },
  {
    sector: "Economic Sector" as const,
    descriptions: [
      "Livelihood Training Program",
      "Farmers Cooperative Building",
      "Public Market Modernization",
      "Agricultural Training Center",
      "Business Development Center",
    ],
  },
  {
    sector: "Other Services" as const,
    descriptions: [
      "Street Lighting Installation",
      "Water Refilling Station",
      "Waste Management Facility",
      "Sanitation Facilities Construction",
      "Solar Street Light Installation",
    ],
  },
] as const;

function randomBudget(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export function generateMockProjects(
  aipId: string,
  year: number,
  count: number = 6
): AipProjectRow[] {
  const projects: AipProjectRow[] = [];
  const usedDescriptions = new Set<string>();

  for (let i = 0; i < count; i++) {
    const sectorData = SAMPLE_PROJECTS[i % SAMPLE_PROJECTS.length];
    const availableDescs = sectorData.descriptions.filter(
      (d) => !usedDescriptions.has(d)
    );
    const description =
      availableDescs[Math.floor(Math.random() * availableDescs.length)] ||
      sectorData.descriptions[0];
    usedDescriptions.add(description);

    const sectorCode = sectorData.sector.charAt(0);
    const reviewStatuses: ("unreviewed" | "ai_flagged" | "reviewed")[] = [
      "unreviewed",
      "ai_flagged",
      "reviewed",
    ];
    const reviewStatus =
      reviewStatuses[Math.floor(Math.random() * reviewStatuses.length)];

    const project: AipProjectRow = {
      id: `aiprow-mock-${aipId}-${i + 1}`,
      aipId,
      projectRefCode: `${sectorCode}S-${year}-${String(i + 1).padStart(3, "0")}`,
      sector: sectorData.sector,
      amount: randomBudget(300000, 5000000),
      aipDescription: description,
      reviewStatus,
      kind: "health",
    };

    if (reviewStatus === "ai_flagged") {
      project.aiIssues = [
        "Budget allocation needs verification against market rates",
        "Missing detailed cost breakdown for materials and labor",
      ];
    }

    if (reviewStatus === "reviewed") {
      project.officialComment =
        "Reviewed and approved. Budget allocation is within acceptable range.";
    }

    projects.push(project);
  }

  return projects;
}

export function generateMockAIP(
  aipId: string,
  fileName: string,
  year: number,
  scope: LguScope,
  barangayName?: string
): AipHeader {
  const currentDate = new Date().toISOString().split("T")[0];

  return {
    id: aipId,
    scope,
    barangayName: scope === "barangay" ? barangayName || "Uploaded Barangay" : undefined,
    title: `Annual Investment Program ${year}`,
    description: `Development and improvement plan for ${scope} infrastructure, health, education, and social services`,
    year,
    budget: randomBudget(5000000, 50000000),
    uploadedAt: currentDate,
    status: "draft",
    fileName,
    pdfUrl: "",
    summaryText: `Comprehensive development plan for ${year} covering infrastructure improvements, social services enhancement, and economic development initiatives.`,
    detailedBullets: [
      "Infrastructure development and rehabilitation projects",
      "Health and wellness program implementation",
      "Educational facility improvements",
      "Economic and livelihood support initiatives",
      "Environmental protection and sustainability programs",
    ],
    sectors: ["General Sector", "Social Sector", "Economic Sector", "Other Services"],
    uploader: {
      name: "System User",
      role: "Planning Officer",
      uploadDate: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      budgetAllocated: randomBudget(5000000, 50000000),
    },
  };
}
