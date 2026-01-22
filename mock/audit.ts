import type { AuditLog, AuditEventType } from "@/types";

export const MOCK_AUDIT_LOGS: AuditLog[] = [
  {
    id: "al-001",
    scope: "barangay",
    year: 2026,
    name: "Maria Santos",
    position: "Barangay Captain",
    event: "Draft Creation",
    dateTimeISO: "2026-01-20T14:30:00+08:00",
    details:
      'Created new AIP draft document for Q1 2026. Initial budget allocation set at ₱5,800,000.',
  },
  {
    id: "al-002",
    scope: "barangay",
    year: 2026,
    name: "Juan Dela Cruz",
    position: "Barangay Official",
    event: "Project Update",
    dateTimeISO: "2026-01-20T10:15:00+08:00",
    details:
      "Posted update on Barangay Hall Renovation project. Progress: 65%. Interior renovation phase completed.",
  },
  {
    id: "al-003",
    scope: "barangay",
    year: 2026,
    name: "Ana Reyes",
    position: "Barangay Secretary",
    event: "Submission",
    dateTimeISO: "2026-01-19T16:45:00+08:00",
    details:
      'Submitted AIP document "Annual Investment Plan 2026 - Q1" for review. Document ID: aip-2026-infra.',
  },
  {
    id: "al-004",
    scope: "barangay",
    year: 2026,
    name: "Pedro Garcia",
    position: "Barangay Councilor",
    event: "Comment Reply",
    dateTimeISO: "2026-01-19T11:20:00+08:00",
    details:
      "Replied to comment on infrastructure budget allocation. Provided additional clarification on cost breakdown.",
  },
  {
    id: "al-005",
    scope: "barangay",
    year: 2026,
    name: "Juan Dela Cruz",
    position: "Barangay Official",
    event: "Project Update",
    dateTimeISO: "2026-01-18T15:00:00+08:00",
    details:
      "Posted update on Road Concreting Project - Purok 3. Progress: 45%. Foundation work completed.",
  },
  {
    id: "al-006",
    scope: "barangay",
    year: 2026,
    name: "Maria Santos",
    position: "Barangay Captain",
    event: "Revision Upload",
    dateTimeISO: "2026-01-18T09:00:00+08:00",
    details:
      "Uploaded revised version of AIP document addressing feedback from City Review Team.",
  },
  {
    id: "al-007",
    scope: "barangay",
    year: 2026,
    name: "Ana Reyes",
    position: "Barangay Secretary",
    event: "Cancellation",
    dateTimeISO: "2026-01-17T14:15:00+08:00",
    details:
      'Cancelled AIP submission "Q4 2025 Amendment" due to duplicate entry. Document ID: aip-2025-duplicate.',
  },
  {
    id: "al-008",
    scope: "barangay",
    year: 2025,
    name: "Juan Dela Cruz",
    position: "Barangay Official",
    event: "Publish",
    dateTimeISO: "2025-12-20T10:00:00+08:00",
    details:
      'Published AIP document "Annual Investment Plan 2025" after approval. Document ID: aip-2025-published.',
  },
  {
    id: "al-009",
    scope: "barangay",
    year: 2025,
    name: "Pedro Garcia",
    position: "Barangay Councilor",
    event: "Comment Reply",
    dateTimeISO: "2025-12-18T13:40:00+08:00",
    details:
      "Responded to citizen inquiry regarding barangay health station supply allocation.",
  },
  {
    id: "al-010",
    scope: "barangay",
    year: 2024,
    name: "Ana Reyes",
    position: "Barangay Secretary",
    event: "Submission",
    dateTimeISO: "2024-11-30T09:25:00+08:00",
    details:
      'Submitted AIP document "Annual Investment Plan 2024" for review. Document ID: aip-2024-under-review.',
  },
  {
    id: "al-011",
    scope: "barangay",
    year: 2026,
    name: "Carlos Mendoza",
    position: "Barangay Treasurer",
    event: "Draft Creation",
    dateTimeISO: "2026-01-21T08:30:00+08:00",
    details:
      'Created new budget allocation draft for health programs. Initial amount: ₱1,200,000.',
  },
  {
    id: "al-012",
    scope: "barangay",
    year: 2026,
    name: "Rosa Martinez",
    position: "Barangay Health Worker",
    event: "Project Update",
    dateTimeISO: "2026-01-21T11:00:00+08:00",
    details:
      "Posted update on Vaccination Drive Program. Progress: 80%. Reached 650 out of 800 target participants.",
  },
  {
    id: "al-013",
    scope: "city",
    year: 2026,
    name: "Benjamin Cruz",
    position: "City Planning Officer",
    event: "Submission",
    dateTimeISO: "2026-01-21T14:00:00+08:00",
    details:
      'Submitted City AIP document "Infrastructure Development Plan 2026" for council approval.',
  },
  {
    id: "al-014",
    scope: "barangay",
    year: 2026,
    name: "Lorna Santiago",
    position: "Barangay Kagawad",
    event: "Comment Reply",
    dateTimeISO: "2026-01-20T16:30:00+08:00",
    details:
      "Responded to citizen feedback about street lighting project timeline and budget allocation.",
  },
  {
    id: "al-015",
    scope: "barangay",
    year: 2026,
    name: "Miguel Torres",
    position: "Barangay Engineer",
    event: "Project Update",
    dateTimeISO: "2026-01-20T09:45:00+08:00",
    details:
      "Posted update on Drainage System Improvement. Progress: 55%. Main channel excavation completed.",
  },
  {
    id: "al-016",
    scope: "city",
    year: 2026,
    name: "Diana Lopez",
    position: "City Budget Officer",
    event: "Revision Upload",
    dateTimeISO: "2026-01-19T13:20:00+08:00",
    details:
      "Uploaded revised city budget allocation incorporating barangay feedback and adjustments.",
  },
  {
    id: "al-017",
    scope: "barangay",
    year: 2026,
    name: "Roberto Aquino",
    position: "Barangay Official",
    event: "Cancellation",
    dateTimeISO: "2026-01-19T08:00:00+08:00",
    details:
      'Cancelled project proposal "Community Garden Phase 2" due to insufficient funding.',
  },
  {
    id: "al-018",
    scope: "barangay",
    year: 2025,
    name: "Elena Ramos",
    position: "Barangay Secretary",
    event: "Publish",
    dateTimeISO: "2025-12-15T10:30:00+08:00",
    details:
      'Published approved AIP document "Q4 2025 Infrastructure Projects" for public viewing.',
  },
  {
    id: "al-019",
    scope: "city",
    year: 2025,
    name: "Antonio Flores",
    position: "City Engineer",
    event: "Project Update",
    dateTimeISO: "2025-12-10T15:15:00+08:00",
    details:
      "Posted update on City Road Widening Project. Progress: 70%. Asphalt laying phase initiated.",
  },
  {
    id: "al-020",
    scope: "barangay",
    year: 2025,
    name: "Gemma Villanueva",
    position: "Barangay Health Officer",
    event: "Comment Reply",
    dateTimeISO: "2025-12-05T11:45:00+08:00",
    details:
      "Replied to inquiry about maternal health program budget and target beneficiaries.",
  },
  {
    id: "al-021",
    scope: "barangay",
    year: 2025,
    name: "Francisco Bautista",
    position: "Barangay Captain",
    event: "Draft Creation",
    dateTimeISO: "2025-11-28T14:00:00+08:00",
    details:
      'Created draft for year-end project completion report. Total projects reviewed: 15.',
  },
  {
    id: "al-022",
    scope: "city",
    year: 2025,
    name: "Isabel Fernandez",
    position: "City Administrator",
    event: "Submission",
    dateTimeISO: "2025-11-20T09:00:00+08:00",
    details:
      'Submitted consolidated city-wide AIP report for 2025 fiscal year review.',
  },
  {
    id: "al-023",
    scope: "barangay",
    year: 2025,
    name: "Ramon Castillo",
    position: "Barangay Councilor",
    event: "Project Update",
    dateTimeISO: "2025-11-15T16:20:00+08:00",
    details:
      "Posted update on Basketball Court Construction. Progress: 90%. Final painting and marking in progress.",
  },
  {
    id: "al-024",
    scope: "barangay",
    year: 2025,
    name: "Teresa Gonzales",
    position: "Barangay Official",
    event: "Revision Upload",
    dateTimeISO: "2025-11-10T10:30:00+08:00",
    details:
      "Uploaded revised project timeline for Community Hall Construction with extended completion date.",
  },
  {
    id: "al-025",
    scope: "city",
    year: 2025,
    name: "Victor Mercado",
    position: "City Treasurer",
    event: "Cancellation",
    dateTimeISO: "2025-11-05T13:15:00+08:00",
    details:
      'Cancelled budget line item for "Urban Park Development Phase 3" due to reallocation priorities.',
  },
  {
    id: "al-026",
    scope: "barangay",
    year: 2025,
    name: "Luisa Navarro",
    position: "Barangay Secretary",
    event: "Publish",
    dateTimeISO: "2025-10-30T08:45:00+08:00",
    details:
      'Published AIP document "Social Services Programs Q3 2025" after final approval.',
  },
  {
    id: "al-027",
    scope: "barangay",
    year: 2025,
    name: "Eduardo Rivera",
    position: "Barangay Engineer",
    event: "Comment Reply",
    dateTimeISO: "2025-10-25T14:50:00+08:00",
    details:
      "Responded to technical questions about road concreting specifications and materials used.",
  },
  {
    id: "al-028",
    scope: "city",
    year: 2025,
    name: "Patricia Santos",
    position: "City Planning Officer",
    event: "Draft Creation",
    dateTimeISO: "2025-10-20T11:00:00+08:00",
    details:
      'Created preliminary draft for 2026 City Development Plan. Focus areas: transport and health.',
  },
  {
    id: "al-029",
    scope: "barangay",
    year: 2025,
    name: "Alfredo Morales",
    position: "Barangay Kagawad",
    event: "Project Update",
    dateTimeISO: "2025-10-15T15:30:00+08:00",
    details:
      "Posted update on Street Lighting Installation Phase 2. Progress: 40%. Poles installed in Purok 1-3.",
  },
  {
    id: "al-030",
    scope: "barangay",
    year: 2025,
    name: "Marissa Cruz",
    position: "Barangay Official",
    event: "Submission",
    dateTimeISO: "2025-10-10T09:15:00+08:00",
    details:
      'Submitted quarterly project status report covering 8 ongoing infrastructure projects.',
  },
  {
    id: "al-031",
    scope: "city",
    year: 2025,
    name: "Rodrigo Perez",
    position: "City Engineer",
    event: "Revision Upload",
    dateTimeISO: "2025-10-05T13:40:00+08:00",
    details:
      "Uploaded revised engineering plans for Public Market Modernization with updated cost estimates.",
  },
  {
    id: "al-032",
    scope: "barangay",
    year: 2024,
    name: "Carmen Valdez",
    position: "Barangay Health Worker",
    event: "Project Update",
    dateTimeISO: "2024-12-20T10:20:00+08:00",
    details:
      "Posted update on Senior Citizens Wellness Program. Progress: 100%. Successfully served 450 seniors.",
  },
  {
    id: "al-033",
    scope: "barangay",
    year: 2024,
    name: "Hernando Suarez",
    position: "Barangay Captain",
    event: "Publish",
    dateTimeISO: "2024-12-15T14:00:00+08:00",
    details:
      'Published year-end summary report "2024 Barangay Development Achievements" for transparency.',
  },
  {
    id: "al-034",
    scope: "city",
    year: 2024,
    name: "Angelica Reyes",
    position: "City Budget Officer",
    event: "Comment Reply",
    dateTimeISO: "2024-12-10T11:30:00+08:00",
    details:
      "Replied to barangay inquiry regarding fund release schedule for Q1 2025 projects.",
  },
  {
    id: "al-035",
    scope: "barangay",
    year: 2024,
    name: "Fernando Diaz",
    position: "Barangay Treasurer",
    event: "Cancellation",
    dateTimeISO: "2024-12-05T08:50:00+08:00",
    details:
      'Cancelled duplicate budget entry for "Water System Rehabilitation" project.',
  },
  {
    id: "al-036",
    scope: "barangay",
    year: 2024,
    name: "Gloria Pascual",
    position: "Barangay Secretary",
    event: "Draft Creation",
    dateTimeISO: "2024-11-25T15:10:00+08:00",
    details:
      'Created draft proposal for 2025 Peace and Order Program. Proposed budget: ₱800,000.',
  },
  {
    id: "al-037",
    scope: "city",
    year: 2024,
    name: "Salvador Rojas",
    position: "City Administrator",
    event: "Submission",
    dateTimeISO: "2024-11-20T09:40:00+08:00",
    details:
      'Submitted city-wide investment portfolio for 2025 to regional development council.',
  },
  {
    id: "al-038",
    scope: "barangay",
    year: 2024,
    name: "Cecilia Gomez",
    position: "Barangay Councilor",
    event: "Project Update",
    dateTimeISO: "2024-11-15T13:25:00+08:00",
    details:
      "Posted update on Barangay Hall Renovation. Progress: 85%. Electrical and plumbing work completed.",
  },
  {
    id: "al-039",
    scope: "city",
    year: 2024,
    name: "Nestor Alvarez",
    position: "City Planning Officer",
    event: "Revision Upload",
    dateTimeISO: "2024-11-10T10:55:00+08:00",
    details:
      "Uploaded revised zoning map and development guidelines for northern district expansion.",
  },
  {    id: "al-040",
    scope: "barangay",
    year: 2024,
    name: "Violeta Santos",
    position: "Barangay Official",
    event: "Publish",
    dateTimeISO: "2024-11-05T16:00:00+08:00",
    details:
      'Published transparency report "2024 Q3 Budget Utilization and Project Status" for public access.',
  },
];

export function getAuditYears(items: AuditLog[]) {
  return Array.from(new Set(items.map((x) => x.year))).sort((a, b) => b - a);
}

export function getAuditEvents(items: AuditLog[]) {
  return Array.from(new Set(items.map((x) => x.event))).sort();
}
