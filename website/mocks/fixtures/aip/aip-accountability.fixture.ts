import { AIP_IDS } from "@/mocks/fixtures/shared/id-contract.fixture";

export const AIP_ACCOUNTABILITY_BY_ID = {
  [AIP_IDS.city_2026]: {
    uploadedBy: {
      name: "Maria Santos",
      role: "Planning Officer",
      office: "City Planning and Development Office",
    },
    reviewedBy: null,
    approvedBy: {
      name: "Jose Ramirez",
      role: "City Official",
      office: "Office of the City Mayor",
    },
    uploadDate: "2025-11-15",
    approvalDate: "2025-12-28",
  },
  [AIP_IDS.city_2025]: {
    uploadedBy: {
      name: "Engineer Roberto Cruz",
      role: "City Planning Officer",
      office: "City Planning and Development Office",
    },
    reviewedBy: null,
    approvedBy: {
      name: "Jose Ramirez",
      role: "City Official",
      office: "Office of the City Mayor",
    },
    uploadDate: "2025-01-08",
    approvalDate: "2025-02-15",
  },
} as const;
