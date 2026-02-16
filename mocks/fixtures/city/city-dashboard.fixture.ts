import type { CityDashboardData } from "@/lib/repos/city-dashboard/types";
import { AIP_IDS } from "@/mocks/fixtures/shared/id-contract.fixture";

export const CITY_DASHBOARD_SCOPE = {
  cityId: "city_001",
  cityName: "Cabuyao City",
  psgcCode: "043407",
} as const;

export const CITY_DASHBOARD_DEFAULT_YEAR = 2026;

export const CITY_DASHBOARD_FIXTURES: Record<number, CityDashboardData> = {
  2026: {
    scope: { ...CITY_DASHBOARD_SCOPE },
    selectedYear: 2026,
    availableYears: [2026, 2025, 2024, 2023],
    queueMetrics: {
      pendingReview: 5,
      underReview: 3,
      forRevision: 1,
      availableToClaim: 5,
      oldestPendingDays: 20,
      asOfLabel: "As of today",
      availableToClaimLabel: "Ready for review",
    },
    statusDistribution: [
      { status: "pending_review", count: 5 },
      { status: "under_review", count: 3 },
      { status: "for_revision", count: 1 },
      { status: "published", count: 1 },
    ],
    pendingReviewAging: [
      { label: "0-3 days", count: 0 },
      { label: "4-7 days", count: 1 },
      { label: "8-14 days", count: 2 },
      { label: "15+ days", count: 2 },
    ],
    dateCard: {
      day: "16",
      weekday: "MONDAY",
      month: "FEBRUARY",
      year: 2026,
    },
    workingOn: [
      {
        id: "working_001",
        barangayName: "Brgy. San Isidro",
        status: "under_review",
        daysInStatus: 8,
      },
      {
        id: "working_002",
        barangayName: "Brgy. Talon",
        status: "under_review",
        daysInStatus: 2,
      },
    ],
    cityAipStatus: {
      hasCityAipForYear: false,
      warningTitle: "Missing City AIP",
      warningMessage: "No City AIP uploaded for 2026.",
      ctaHref: "/city/aips",
    },
    publicationTimeline: [
      { year: 2023, publishedCount: 1 },
      { year: 2024, publishedCount: 1 },
      { year: 2025, publishedCount: 1 },
    ],
    cityAipsByYear: [
      {
        id: AIP_IDS.city_2025,
        year: 2025,
        status: "published",
        uploadedBy: "Admin User",
        uploadDate: "2025-12-15",
        actionHref: "/city/aips/aip-2025-city",
      },
      {
        id: "city_aip_2024",
        year: 2024,
        status: "published",
        uploadedBy: "City Planner",
        uploadDate: "2024-12-10",
        actionHref: "/city/aips/aip-2025-city",
      },
      {
        id: "city_aip_2023",
        year: 2023,
        status: "published",
        uploadedBy: "City Planner",
        uploadDate: "2023-12-12",
        actionHref: "/city/aips/aip-2025-city",
      },
    ],
    engagementPulse: {
      newThisWeek: 28,
      awaitingReply: 12,
      moderated: 3,
      commentsTrend: [
        { label: "Mon", value: 3 },
        { label: "Tue", value: 5 },
        { label: "Wed", value: 4 },
        { label: "Thu", value: 7 },
        { label: "Fri", value: 6 },
        { label: "Sat", value: 2 },
        { label: "Sun", value: 1 },
      ],
      commentTargets: [
        { category: "City AIPs", count: 20 },
        { category: "Health Projects", count: 7 },
        { category: "Infrastructure Projects", count: 5 },
      ],
    },
    recentComments: [
      {
        id: "comment_001",
        sourceLabel: "Barangay AIP",
        title: "Brgy. Mamadid 2026 AIP",
        snippet:
          "The health programs allocation seems insufficient for our growing population.",
        author: "Pedro Garcia",
        timestampLabel: "2 hours ago",
        replyAvailable: true,
      },
      {
        id: "comment_002",
        sourceLabel: "City AIP",
        title: "City AIP 2026",
        snippet:
          "We appreciate the focus on infrastructure development in our district.",
        author: "Maria Santos",
        timestampLabel: "5 hours ago",
        replyAvailable: false,
      },
      {
        id: "comment_003",
        sourceLabel: "Project",
        title: "Road Widening - Brgy. Pulo",
        snippet:
          "This comment has been flagged and moderated by administrators for follow-up.",
        author: "Pedro Garcia",
        timestampLabel: "1 day ago",
        replyAvailable: false,
      },
      {
        id: "comment_004",
        sourceLabel: "Barangay AIP",
        title: "Brgy. Banaybanay 2026 AIP",
        snippet:
          "Glad to see the disaster preparedness programs included in this plan.",
        author: "Ana Reyes",
        timestampLabel: "1 day ago",
        replyAvailable: false,
      },
      {
        id: "comment_005",
        sourceLabel: "Barangay AIP",
        title: "Brgy. San Isidro 2026 AIP",
        snippet:
          "Could we get more details on the timeline for the water system upgrade?",
        author: "Carlos Mendoza",
        timestampLabel: "2 days ago",
        replyAvailable: false,
      },
    ],
  },
  2025: {
    scope: { ...CITY_DASHBOARD_SCOPE },
    selectedYear: 2025,
    availableYears: [2026, 2025, 2024, 2023],
    queueMetrics: {
      pendingReview: 2,
      underReview: 1,
      forRevision: 1,
      availableToClaim: 2,
      oldestPendingDays: 11,
      asOfLabel: "As of today",
      availableToClaimLabel: "Ready for review",
    },
    statusDistribution: [
      { status: "pending_review", count: 2 },
      { status: "under_review", count: 1 },
      { status: "for_revision", count: 1 },
      { status: "published", count: 3 },
    ],
    pendingReviewAging: [
      { label: "0-3 days", count: 1 },
      { label: "4-7 days", count: 1 },
      { label: "8-14 days", count: 0 },
      { label: "15+ days", count: 0 },
    ],
    dateCard: {
      day: "16",
      weekday: "MONDAY",
      month: "FEBRUARY",
      year: 2025,
    },
    workingOn: [
      {
        id: "working_101",
        barangayName: "Brgy. Sala",
        status: "pending_review",
        daysInStatus: 3,
      },
      {
        id: "working_102",
        barangayName: "Brgy. Diezmo",
        status: "under_review",
        daysInStatus: 7,
      },
    ],
    cityAipStatus: {
      hasCityAipForYear: true,
      warningTitle: "City AIP Uploaded",
      warningMessage: "City AIP for 2025 is available.",
      ctaHref: "/city/aips",
    },
    publicationTimeline: [
      { year: 2022, publishedCount: 1 },
      { year: 2023, publishedCount: 1 },
      { year: 2024, publishedCount: 1 },
    ],
    cityAipsByYear: [
      {
        id: AIP_IDS.city_2025,
        year: 2025,
        status: "published",
        uploadedBy: "City Planner",
        uploadDate: "2025-12-15",
        actionHref: "/city/aips/aip-2025-city",
      },
      {
        id: "city_aip_2024",
        year: 2024,
        status: "published",
        uploadedBy: "City Planner",
        uploadDate: "2024-12-10",
        actionHref: "/city/aips/aip-2025-city",
      },
    ],
    engagementPulse: {
      newThisWeek: 14,
      awaitingReply: 4,
      moderated: 2,
      commentsTrend: [
        { label: "Mon", value: 2 },
        { label: "Tue", value: 3 },
        { label: "Wed", value: 2 },
        { label: "Thu", value: 4 },
        { label: "Fri", value: 3 },
        { label: "Sat", value: 1 },
        { label: "Sun", value: 1 },
      ],
      commentTargets: [
        { category: "City AIPs", count: 10 },
        { category: "Health Projects", count: 3 },
        { category: "Infrastructure Projects", count: 2 },
      ],
    },
    recentComments: [
      {
        id: "comment_101",
        sourceLabel: "City AIP",
        title: "City AIP 2025",
        snippet: "Please include more details for flood-control maintenance allocation.",
        author: "Anna Reyes",
        timestampLabel: "3 hours ago",
        replyAvailable: true,
      },
      {
        id: "comment_102",
        sourceLabel: "Project",
        title: "Public Market Rehabilitation",
        snippet: "Construction has improved market hygiene and vendor safety conditions.",
        author: "Jose Villanueva",
        timestampLabel: "1 day ago",
        replyAvailable: false,
      },
    ],
  },
};
