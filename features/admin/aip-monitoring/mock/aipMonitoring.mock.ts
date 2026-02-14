export type AipMonitoringStatus =
  | "Pending"
  | "In Review"
  | "Approved"
  | "For Revision"
  | "Locked";

export type AipMonitoringRow = {
  id: string;
  year: number;
  lguName: string;
  status: AipMonitoringStatus;
  submittedDate: string;
  currentStatusSince: string;
  durationDays: number;
  claimedBy: string | null;
  lastUpdated: string;
  fileName: string;
  pdfUrl?: string;
  summaryText: string;
  detailedBullets: string[];
  submissionHistory: { year: number; submittedDate: string; status: string }[];
  archivedSubmissions: {
    year: number;
    submittedDate: string;
    archivedDate: string;
    reason: string;
  }[];
  timeline: { label: string; date: string; note?: string }[];
};

export type CaseType = "Stuck" | "Duplicate" | "Locked" | "Archived";

export type CaseRow = {
  id: string;
  year: number;
  lguName: string;
  caseType: CaseType;
  durationDays: number;
  claimedBy: string | null;
  lastUpdated: string;
  isArchived?: boolean;
  previousCaseType?: Exclude<CaseType, "Archived">;
};

export const AIP_MONITORING_ROWS: AipMonitoringRow[] = [
  {
    id: "aip-monitor-001",
    year: 2026,
    lguName: "City of Cabuyao",
    status: "In Review",
    submittedDate: "2025-12-28",
    currentStatusSince: "2026-01-03",
    durationDays: 42,
    claimedBy: "Maria Santos",
    lastUpdated: "2026-02-05",
    fileName: "Cabuyao_AIP_2026.pdf",
    pdfUrl: "",
    summaryText:
      "This AIP focuses on infrastructure rehabilitation, community health programs, and socio-economic initiatives aligned with the city's development priorities.",
    detailedBullets: [
      "Road rehabilitation and traffic decongestion projects",
      "Expansion of community health facilities and services",
      "Social protection programs for vulnerable sectors",
      "Economic development and livelihood support initiatives",
      "Environmental management and disaster resilience measures",
    ],
    submissionHistory: [
      { year: 2026, submittedDate: "2025-12-28", status: "In Review" },
      { year: 2025, submittedDate: "2024-12-20", status: "Approved" },
    ],
    archivedSubmissions: [
      {
        year: 2023,
        submittedDate: "2022-12-15",
        archivedDate: "2024-01-10",
        reason: "Superseded by FY 2024 rebaselining.",
      },
    ],
    timeline: [
      { label: "Submitted", date: "Dec 28, 2025" },
      { label: "In Review", date: "Jan 03, 2026" },
      { label: "Reviewer Notes Added", date: "Jan 17, 2026" },
      { label: "Pending Approval", date: "Feb 01, 2026" },
    ],
  },
  {
    id: "aip-monitor-002",
    year: 2026,
    lguName: "Barangay 1",
    status: "Pending",
    submittedDate: "2026-01-10",
    currentStatusSince: "2026-01-10",
    durationDays: 18,
    claimedBy: null,
    lastUpdated: "2026-01-20",
    fileName: "Brgy1_AIP_2026.pdf",
    pdfUrl: "",
    summaryText:
      "Annual investment plan emphasizing barangay facility upgrades, peace and order programs, and youth development initiatives.",
    detailedBullets: [
      "Barangay hall repairs and facility upgrades",
      "Peace and order patrol equipment procurement",
      "Youth skills training and scholarship support",
      "Drainage and flood mitigation improvements",
      "Community wellness programs",
    ],
    submissionHistory: [
      { year: 2026, submittedDate: "2026-01-10", status: "Pending" },
      { year: 2025, submittedDate: "2024-12-12", status: "Approved" },
    ],
    archivedSubmissions: [],
    timeline: [
      { label: "Submitted", date: "Jan 10, 2026" },
      { label: "Pending Review", date: "Jan 10, 2026" },
    ],
  },
  {
    id: "aip-monitor-003",
    year: 2025,
    lguName: "Quezon City",
    status: "Approved",
    submittedDate: "2024-12-22",
    currentStatusSince: "2025-01-12",
    durationDays: 10,
    claimedBy: "Jose Reyes",
    lastUpdated: "2025-01-12",
    fileName: "QC_AIP_2025.pdf",
    pdfUrl: "",
    summaryText:
      "City-wide AIP focused on transport infrastructure, public health investments, and economic resilience programs.",
    detailedBullets: [
      "Public transport hub modernization",
      "Hospital equipment upgrades",
      "Small business support programs",
      "Road safety enhancements",
      "Public market redevelopment",
    ],
    submissionHistory: [
      { year: 2025, submittedDate: "2024-12-22", status: "Approved" },
    ],
    archivedSubmissions: [],
    timeline: [
      { label: "Submitted", date: "Dec 22, 2024" },
      { label: "In Review", date: "Jan 02, 2025" },
      { label: "Approved", date: "Jan 12, 2025" },
    ],
  },
  {
    id: "aip-monitor-004",
    year: 2026,
    lguName: "Barangay 2",
    status: "For Revision",
    submittedDate: "2025-12-30",
    currentStatusSince: "2026-01-15",
    durationDays: 27,
    claimedBy: "Ana Garcia",
    lastUpdated: "2026-01-18",
    fileName: "Brgy2_AIP_2026.pdf",
    pdfUrl: "",
    summaryText:
      "Barangay investment plan with focus on community facilities, youth development, and sanitation improvements.",
    detailedBullets: [
      "Multi-purpose hall improvements",
      "Sanitation and waste management equipment",
      "Youth livelihood training support",
      "Street lighting installation",
      "Health and nutrition programs",
    ],
    submissionHistory: [
      { year: 2026, submittedDate: "2025-12-30", status: "For Revision" },
    ],
    archivedSubmissions: [],
    timeline: [
      { label: "Submitted", date: "Dec 30, 2025" },
      { label: "In Review", date: "Jan 05, 2026" },
      { label: "For Revision", date: "Jan 15, 2026" },
    ],
  },
  {
    id: "aip-monitor-005",
    year: 2026,
    lguName: "Makati City",
    status: "Locked",
    submittedDate: "2025-12-05",
    currentStatusSince: "2025-12-20",
    durationDays: 70,
    claimedBy: "Carmen Lopez",
    lastUpdated: "2026-02-07",
    fileName: "Makati_AIP_2026.pdf",
    pdfUrl: "",
    summaryText:
      "Locked AIP submission due to workflow integrity case; awaiting admin action before resuming review.",
    detailedBullets: [
      "Central business district enhancements",
      "Social services expansion",
      "Flood mitigation projects",
      "Public school facility upgrades",
      "Disaster resilience investments",
    ],
    submissionHistory: [
      { year: 2026, submittedDate: "2025-12-05", status: "Locked" },
    ],
    archivedSubmissions: [],
    timeline: [
      { label: "Submitted", date: "Dec 05, 2025" },
      { label: "In Review", date: "Dec 12, 2025" },
      { label: "Locked", date: "Dec 20, 2025" },
    ],
  },
];

export const CASE_MONITORING_ROWS: CaseRow[] = [
  {
    id: "case-001",
    year: 2026,
    lguName: "Barangay 1",
    caseType: "Stuck",
    durationDays: 35,
    claimedBy: "Maria Santos",
    lastUpdated: "2026-02-02",
  },
  {
    id: "case-002",
    year: 2026,
    lguName: "Pasig City",
    caseType: "Duplicate",
    durationDays: 14,
    claimedBy: null,
    lastUpdated: "2026-01-26",
  },
  {
    id: "case-003",
    year: 2026,
    lguName: "Makati City",
    caseType: "Locked",
    durationDays: 60,
    claimedBy: "Carmen Lopez",
    lastUpdated: "2026-02-07",
  },
];
