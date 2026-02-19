import { AIP_IDS } from "@/mocks/fixtures/shared/id-contract.fixture";

export const AIP_ACCOUNTABILITY_BY_ID = {
  [AIP_IDS.city_2026]: {
    uploadedBy: {
      name: "Maria Santos",
      role: "Planning Officer",
      office: "City Planning and Development Office",
    },
    reviewedBy: null,
    approvedBy: null,
    uploadDate: "2025-11-15",
    approvalDate: "2025-12-28",
  },
} as const;
