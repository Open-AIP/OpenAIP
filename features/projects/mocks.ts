/**
 * ============================================================================
 * PROJECTS FEATURE - MOCK DATA (SELF-CONTAINED)
 * ============================================================================
 * 
 * IMPORTANT DATA ISOLATION RULES:
 * - This data is COMPLETELY INDEPENDENT from the AIP feature
 * - DO NOT import, reference, or derive values from AIP mocks
 * - DO NOT share this data with AIP feature
 * - Field names may overlap (e.g., status, year) but values are Projects-specific
 * - All Projects mock data lives in this feature folder only
 * 
 * This file provides comprehensive mock data for all Projects pages:
 * - List/Grid views with filtering and pagination
 * - Detail pages with full project information
 * - Form dropdowns and default values
 * - Progress updates and milestones
 * ============================================================================
 */

import type {
  ProjectMaster,
  HealthProjectDetails,
  InfrastructureProjectDetails,
  ProjectUpdate,
} from "./types";

// ============================================================================
// CORE PROJECT DATA (Master List)
// ============================================================================

/**
 * Master list of all projects (20 total)
 * - 8 Health projects
 * - 12 Infrastructure projects
 * - Covers years 2024-2026
 * - All statuses represented
 * - Includes edge cases (long titles, various states)
 */
export const PROJECTS_MASTER: ProjectMaster[] = [
  // === HEALTH PROJECTS (8) ===
  {
    projectRefCode: "PROJ-H-2026-001",
    year: 2026,
    kind: "health",
    title: "Community Vaccination Program",
    status: "ongoing",
    imageUrl: "/default/default-no-image.jpg",
  },
  {
    projectRefCode: "PROJ-H-2026-002",
    year: 2026,
    kind: "health",
    title: "Mobile Health Clinic Services",
    status: "ongoing",
    imageUrl: "/default/default-no-image.jpg",
  },
  {
    projectRefCode: "PROJ-H-2026-003",
    year: 2026,
    kind: "health",
    title: "Nutrition Education and Feeding Program",
    status: "planning",
    imageUrl: "/default/default-no-image.jpg",
  },
  {
    projectRefCode: "PROJ-H-2025-001",
    year: 2025,
    kind: "health",
    title: "Maternal and Child Health Enhancement",
    status: "completed",
    imageUrl: "/default/default-no-image.jpg",
  },
  {
    projectRefCode: "PROJ-H-2025-002",
    year: 2025,
    kind: "health",
    title: "Dengue Prevention and Control Campaign",
    status: "completed",
    imageUrl: "/default/default-no-image.jpg",
  },
  {
    projectRefCode: "PROJ-H-2026-004",
    year: 2026,
    kind: "health",
    title: "Senior Citizens Wellness Program with Extended Community Outreach and Health Monitoring Services",
    status: "on_hold",
    imageUrl: "/default/default-no-image.jpg",
  },
  {
    projectRefCode: "PROJ-H-2026-005",
    year: 2026,
    kind: "health",
    title: "Mental Health Awareness Campaign",
    status: "ongoing",
    imageUrl: "/default/default-no-image.jpg",
  },
  {
    projectRefCode: "PROJ-H-2026-006",
    year: 2026,
    kind: "health",
    title: "COVID-19 Booster Vaccination Drive",
    status: "planning",
    imageUrl: "/default/default-no-image.jpg",
  },

  // === INFRASTRUCTURE PROJECTS (12) ===
  {
    projectRefCode: "PROJ-I-2026-001",
    year: 2026,
    kind: "infrastructure",
    title: "Road Concreting and Rehabilitation (2.5km)",
    status: "ongoing",
    imageUrl: "/mock/infra/road1.jpg",
  },
  {
    projectRefCode: "PROJ-I-2026-002",
    year: 2026,
    kind: "infrastructure",
    title: "Barangay Multi-Purpose Hall Construction",
    status: "ongoing",
    imageUrl: "/mock/infra/hall1.jpg",
  },
  {
    projectRefCode: "PROJ-I-2026-003",
    year: 2026,
    kind: "infrastructure",
    title: "Drainage System Improvement Project",
    status: "planning",
    imageUrl: "/default/default-no-image.jpg",
  },
  {
    projectRefCode: "PROJ-I-2025-001",
    year: 2025,
    kind: "infrastructure",
    title: "Basketball Court Renovation",
    status: "completed",
    imageUrl: "/mock/infra/court1.jpg",
  },
  {
    projectRefCode: "PROJ-I-2025-002",
    year: 2025,
    kind: "infrastructure",
    title: "Street Lighting Installation Phase 1",
    status: "completed",
    imageUrl: "/default/default-no-image.jpg",
  },
  {
    projectRefCode: "PROJ-I-2026-004",
    year: 2026,
    kind: "infrastructure",
    title: "Bridge Construction over San Roque Creek",
    status: "on_hold",
    imageUrl: "/default/default-no-image.jpg",
  },
  {
    projectRefCode: "PROJ-I-2026-005",
    year: 2026,
    kind: "infrastructure",
    title: "Flood Control and Retaining Wall Project",
    status: "ongoing",
    imageUrl: "/mock/infra/wall1.jpg",
  },
  {
    projectRefCode: "PROJ-I-2026-006",
    year: 2026,
    kind: "infrastructure",
    title: "Water Supply System Upgrade",
    status: "planning",
    imageUrl: "/default/default-no-image.jpg",
  },
  {
    projectRefCode: "PROJ-I-2026-007",
    year: 2026,
    kind: "infrastructure",
    title: "Public Market Rehabilitation and Modernization",
    status: "ongoing",
    imageUrl: "/default/default-no-image.jpg",
  },
  {
    projectRefCode: "PROJ-I-2024-001",
    year: 2024,
    kind: "infrastructure",
    title: "Pedestrian Pathway Construction (1.2km)",
    status: "completed",
    imageUrl: "/default/default-no-image.jpg",
  },
  {
    projectRefCode: "PROJ-I-2026-008",
    year: 2026,
    kind: "infrastructure",
    title: "Solar Street Lights Installation Phase 2",
    status: "planning",
    imageUrl: "/default/default-no-image.jpg",
  },
  {
    projectRefCode: "PROJ-I-2026-009",
    year: 2026,
    kind: "infrastructure",
    title: "Barangay Health Center Expansion",
    status: "ongoing",
    imageUrl: "/default/default-no-image.jpg",
  },
];

// ============================================================================
// HEALTH PROJECT DETAILS
// ============================================================================

export const HEALTH_DETAILS: HealthProjectDetails[] = [
  {
    projectRefCode: "PROJ-H-2026-001",
    month: "January",
    totalTargetParticipants: 5000,
    targetParticipants: "All Barangay Residents",
    implementingOffice: "Barangay Health Office",
    budgetAllocated: 250000,
  },
  {
    projectRefCode: "PROJ-H-2026-002",
    month: "February",
    totalTargetParticipants: 1500,
    targetParticipants: "Remote Communities",
    implementingOffice: "Rural Health Unit",
    budgetAllocated: 180000,
  },
  {
    projectRefCode: "PROJ-H-2026-003",
    month: "March",
    totalTargetParticipants: 800,
    targetParticipants: "Children Ages 5-12",
    implementingOffice: "Barangay Nutrition Council",
    budgetAllocated: 150000,
  },
  {
    projectRefCode: "PROJ-H-2025-001",
    month: "April",
    totalTargetParticipants: 2000,
    targetParticipants: "Pregnant Women and New Mothers",
    implementingOffice: "City Health Office",
    budgetAllocated: 320000,
  },
  {
    projectRefCode: "PROJ-H-2025-002",
    month: "June",
    totalTargetParticipants: 10000,
    targetParticipants: "All Households",
    implementingOffice: "Barangay Health Office",
    budgetAllocated: 280000,
  },
  {
    projectRefCode: "PROJ-H-2026-004",
    month: "May",
    totalTargetParticipants: 600,
    targetParticipants: "Senior Citizens (60 years and above)",
    implementingOffice: "Office of Senior Citizens Affairs",
    budgetAllocated: 0, // Edge case: zero budget (on_hold)
  },
  {
    projectRefCode: "PROJ-H-2026-005",
    month: "July",
    totalTargetParticipants: 3000,
    targetParticipants: "Adults and Youth",
    implementingOffice: "Barangay Health Office",
    budgetAllocated: 120000,
  },
  {
    projectRefCode: "PROJ-H-2026-006",
    month: "August",
    totalTargetParticipants: 4500,
    targetParticipants: "Eligible Population for Booster Shots",
    implementingOffice: "Municipal Health Office",
    budgetAllocated: 200000,
  },
];

// ============================================================================
// INFRASTRUCTURE PROJECT DETAILS
// ============================================================================

export const INFRASTRUCTURE_DETAILS: InfrastructureProjectDetails[] = [
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
    contractCost: 8500000, // Edge case: high-value contract
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

// ============================================================================
// PROJECT UPDATES & MILESTONES
// ============================================================================

export const PROJECT_UPDATES: ProjectUpdate[] = [
  // Health Project Updates
  {
    id: "UPD-H-001-1",
    projectRefCode: "PROJ-H-2026-001",
    title: "Vaccination Day 1 Completed",
    date: "2026-01-12",
    description: "Successfully vaccinated priority groups including healthcare workers and elderly residents. Mobile teams deployed to remote sitios.",
    progressPercent: 40,
    attendanceCount: 2000,
    photoUrls: ["/mock/health/vax1.jpg", "/mock/health/vax2.jpg"],
  },
  {
    id: "UPD-H-001-2",
    projectRefCode: "PROJ-H-2026-001",
    title: "Mid-Program Assessment",
    date: "2026-01-20",
    description: "Conducted mid-program evaluation. Vaccination coverage exceeded initial targets. Planning additional outreach for underserved areas.",
    progressPercent: 65,
    attendanceCount: 3250,
  },
  {
    id: "UPD-H-002-1",
    projectRefCode: "PROJ-H-2026-002",
    title: "Mobile Clinic Launch",
    date: "2026-02-05",
    description: "First mobile health clinic deployed to upland barangays. Services include basic consultation, dental check-up, and medicine distribution.",
    progressPercent: 30,
    attendanceCount: 450,
    photoUrls: ["/mock/health/clinic1.jpg"],
  },
  {
    id: "UPD-H-005-1",
    projectRefCode: "PROJ-H-2026-005",
    title: "Mental Health Seminar Series Kickoff",
    date: "2026-07-10",
    description: "Launched mental health awareness seminar series with trained psychologists. Topics cover stress management and emotional well-being.",
    progressPercent: 20,
    attendanceCount: 850,
  },

  // Infrastructure Project Updates
  {
    id: "UPD-I-001-1",
    projectRefCode: "PROJ-I-2026-001",
    title: "Groundbreaking Ceremony",
    date: "2026-01-10",
    description: "Official groundbreaking ceremony held with barangay officials and community members. Contractor mobilized equipment and materials.",
    progressPercent: 5,
    photoUrls: ["/mock/infra/ground1.jpg", "/mock/infra/ground2.jpg"],
  },
  {
    id: "UPD-I-001-2",
    projectRefCode: "PROJ-I-2026-001",
    title: "Base Course Completion - Segment 1",
    date: "2026-02-15",
    description: "Completed base course installation for first 800 meters. Compaction testing passed quality standards.",
    progressPercent: 32,
  },
  {
    id: "UPD-I-001-3",
    projectRefCode: "PROJ-I-2026-001",
    title: "Concrete Pouring Phase 1",
    date: "2026-03-10",
    description: "First phase concrete pouring completed covering 1.2km stretch. Weather conditions favorable.",
    progressPercent: 58,
    photoUrls: ["/mock/infra/concrete1.jpg"],
  },
  {
    id: "UPD-I-002-1",
    projectRefCode: "PROJ-I-2026-002",
    title: "Foundation Work Completed",
    date: "2026-02-28",
    description: "Foundation and column installation completed. Structural integrity verified by project engineer.",
    progressPercent: 35,
  },
  {
    id: "UPD-I-002-2",
    projectRefCode: "PROJ-I-2026-002",
    title: "Roofing Installation In Progress",
    date: "2026-04-15",
    description: "Steel truss and roofing installation underway. Wall finishing ongoing.",
    progressPercent: 62,
  },
  {
    id: "UPD-I-005-1",
    projectRefCode: "PROJ-I-2026-005",
    title: "Retaining Wall Construction Started",
    date: "2026-02-01",
    description: "Excavation completed for retaining wall foundation. Formwork and rebar installation in progress.",
    progressPercent: 25,
  },

  // Edge case: Project with zero progress
  {
    id: "UPD-I-004-1",
    projectRefCode: "PROJ-I-2026-004",
    title: "Environmental Clearance Pending",
    date: "2026-01-25",
    description: "Project on hold pending environmental compliance certificate from DENR.",
    progressPercent: 0, // Edge case: 0% progress
  },

  // Completed project
  {
    id: "UPD-I-012-1",
    projectRefCode: "PROJ-I-2025-001",
    title: "Final Inspection and Turnover",
    date: "2025-08-15",
    description: "Final inspection completed. All punch list items addressed. Court officially turned over to barangay.",
    progressPercent: 100,
    photoUrls: ["/mock/infra/court-final.jpg"],
  },
  {
    id: "UPD-H-004-1",
    projectRefCode: "PROJ-H-2025-001",
    title: "Program Completion and Impact Report",
    date: "2025-06-30",
    description: "Program successfully completed. Reduced infant mortality by 35%.",
    progressPercent: 100,
    attendanceCount: 2000,
  },
];

// ============================================================================
// FORM OPTIONS & CONSTANTS
// ============================================================================

export const FORM_OPTIONS = {
  projectKinds: [
    { value: "health", label: "Health" },
    { value: "infrastructure", label: "Infrastructure" },
  ],
  
  statuses: [
    { value: "planning", label: "Planning" },
    { value: "ongoing", label: "Ongoing" },
    { value: "completed", label: "Completed" },
    { value: "on_hold", label: "On Hold" },
  ],
  
  implementingOffices: [
    { value: "barangay_health", label: "Barangay Health Office" },
    { value: "barangay_engineering", label: "Barangay Engineering Office" },
    { value: "municipal_health", label: "Municipal Health Office" },
    { value: "city_health", label: "City Health Office" },
    { value: "rural_health", label: "Rural Health Unit" },
  ],
  
  fundingSources: [
    { value: "dev_fund_20", label: "20% Development Fund" },
    { value: "general_fund", label: "General Fund Allocation" },
    { value: "calamity_fund", label: "Calamity Fund" },
    { value: "infrastructure_fund", label: "Infrastructure Fund" },
  ],
};
