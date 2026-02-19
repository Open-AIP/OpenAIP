type InfrastructureProjectDetails = {
  projectRefCode: string;
  startDate: string;
  targetCompletionDate: string;
  implementingOffice: string;
  fundingSource: string;
  contractorName: string;
  contractCost: number;
};

export const INFRA_DETAILS_TABLE: InfrastructureProjectDetails[] = [
  {
    projectRefCode: "PROJ-I-2026-001",
    startDate: "2026-01-10",
    targetCompletionDate: "2026-05-30",
    implementingOffice: "Barangay Engineering Office",
    fundingSource: "20% Development Fund",
    contractorName: "ABC Construction Services",
    contractCost: 2200000,
  },
  {
    projectRefCode: "PROJ-I-2026-002",
    startDate: "2026-02-01",
    targetCompletionDate: "2026-07-15",
    implementingOffice: "Municipal Engineering Office",
    fundingSource: "General Fund Allocation",
    contractorName: "BuildRight Contractors Inc.",
    contractCost: 3500000,
  },
  {
    projectRefCode: "PROJ-I-2026-003",
    startDate: "2026-03-15",
    targetCompletionDate: "2026-09-30",
    implementingOffice: "Barangay Public Works",
    fundingSource: "Special Development Fund",
    contractorName: "DrainMaster Solutions",
    contractCost: 1800000,
  },
  {
    projectRefCode: "PROJ-I-2025-001",
    startDate: "2025-05-01",
    targetCompletionDate: "2025-08-15",
    implementingOffice: "Barangay Sports Office",
    fundingSource: "Community Development Fund",
    contractorName: "SportsBuild Co.",
    contractCost: 450000,
  },
  {
    projectRefCode: "PROJ-I-2025-002",
    startDate: "2025-03-10",
    targetCompletionDate: "2025-06-30",
    implementingOffice: "Electrical Services Division",
    fundingSource: "Infrastructure Fund",
    contractorName: "LightWorks Electrical",
    contractCost: 890000,
  },
  {
    projectRefCode: "PROJ-I-2026-004",
    startDate: "2026-01-20",
    targetCompletionDate: "2026-12-31",
    implementingOffice: "Provincial Engineering Office",
    fundingSource: "National Bridge Program",
    contractorName: "MegaBridge Construction Corp.",
    contractCost: 8500000,
  },
  {
    projectRefCode: "PROJ-I-2026-005",
    startDate: "2026-01-25",
    targetCompletionDate: "2026-06-20",
    implementingOffice: "Disaster Risk Reduction Office",
    fundingSource: "Calamity Fund",
    contractorName: "FloodGuard Engineering",
    contractCost: 2900000,
  },
  {
    projectRefCode: "PROJ-I-2026-006",
    startDate: "2026-04-01",
    targetCompletionDate: "2026-11-30",
    implementingOffice: "Water District Office",
    fundingSource: "Water Infrastructure Fund",
    contractorName: "AquaTech Systems Inc.",
    contractCost: 4200000,
  },
  {
    projectRefCode: "PROJ-I-2026-007",
    startDate: "2026-02-10",
    targetCompletionDate: "2026-08-31",
    implementingOffice: "Economic Development Office",
    fundingSource: "Market Development Fund",
    contractorName: "ModernBuild Contractors",
    contractCost: 5600000,
  },
  {
    projectRefCode: "PROJ-I-2024-001",
    startDate: "2024-06-01",
    targetCompletionDate: "2024-10-15",
    implementingOffice: "Barangay Engineering Office",
    fundingSource: "Pedestrian Safety Fund",
    contractorName: "PathWay Construction",
    contractCost: 980000,
  },
  {
    projectRefCode: "PROJ-I-2026-008",
    startDate: "2026-05-01",
    targetCompletionDate: "2026-10-31",
    implementingOffice: "Electrical Services Division",
    fundingSource: "Green Energy Fund",
    contractorName: "SolarTech Installations",
    contractCost: 1200000,
  },
  {
    projectRefCode: "PROJ-I-2026-009",
    startDate: "2026-01-15",
    targetCompletionDate: "2026-05-15",
    implementingOffice: "Barangay Health Office",
    fundingSource: "Health Infrastructure Fund",
    contractorName: "MediBuilder Contractors",
    contractCost: 1750000,
  },
];
