import type { LandingContentVM, ProjectCardVM } from "@/lib/domain/landing-content";
import type { LandingContentRepo } from "./repo";

function buildHealthProjects(): ProjectCardVM[] {
  return [
    {
      id: "health-001",
      title: "Community Health Center Expansion",
      subtitle: "Construction and equipment upgrade in Brgy. Pulo",
      tagLabel: "Priority",
      budget: 13_500_000,
      meta: ["Brgy. Pulo", "Q2-Q4 2026", "City Health Office"],
    },
    {
      id: "health-002",
      title: "Maternal Care Access Program",
      subtitle: "Expanded prenatal outreach and diagnostics",
      tagLabel: "Ongoing",
      budget: 8_100_000,
      meta: ["City-wide", "Q1-Q4 2026", "RHU Network"],
    },
    {
      id: "health-003",
      title: "Barangay Vaccination Cold Chain",
      subtitle: "Storage, transport coolers, and handling kits",
      tagLabel: "New",
      budget: 5_400_000,
      meta: ["6 barangays", "Q2 2026", "Public Health Unit"],
    },
    {
      id: "health-004",
      title: "Mobile Clinic Fleet Upgrade",
      subtitle: "Vehicle retrofit and telemedicine support",
      tagLabel: "Ongoing",
      budget: 9_750_000,
      meta: ["Mobile services", "Q3 2026", "City Engineering"],
    },
    {
      id: "health-005",
      title: "Nutrition Monitoring for Schools",
      subtitle: "Screening and intervention program rollout",
      tagLabel: "Priority",
      budget: 4_900_000,
      meta: ["Public schools", "Q1-Q4 2026", "School Health Team"],
    },
    {
      id: "health-006",
      title: "Emergency Response Medical Stocks",
      subtitle: "Buffer inventory for disaster-ready clinics",
      tagLabel: "New",
      budget: 3_850_000,
      meta: ["City warehouse", "Q2 2026", "DRRM + CHO"],
    },
  ];
}

function buildInfrastructureProjects(): ProjectCardVM[] {
  return [
    {
      id: "infra-001",
      title: "Drainage Rehabilitation Package A",
      subtitle: "Flood-prone corridor mitigation works",
      tagLabel: "Priority",
      budget: 15_200_000,
      meta: ["North district", "Q2-Q4 2026", "City Engineering"],
    },
    {
      id: "infra-002",
      title: "Farm-to-Market Access Road",
      subtitle: "Road widening and asphalt overlay",
      tagLabel: "Ongoing",
      budget: 12_800_000,
      meta: ["Brgy. Mamatid", "Q1-Q3 2026", "City Engineering"],
    },
    {
      id: "infra-003",
      title: "Public School Retrofit Program",
      subtitle: "Classroom reinforcement and repairs",
      tagLabel: "Ongoing",
      budget: 11_350_000,
      meta: ["4 campuses", "Q2-Q4 2026", "DepEd + LGU"],
    },
    {
      id: "infra-004",
      title: "Waterline Extension Cluster B",
      subtitle: "Household service line expansion",
      tagLabel: "New",
      budget: 9_600_000,
      meta: ["South district", "Q2 2026", "Waterworks"],
    },
    {
      id: "infra-005",
      title: "Bridge Strengthening Works",
      subtitle: "Structural reinforcement and lane safety",
      tagLabel: "Priority",
      budget: 14_750_000,
      meta: ["2 bridges", "Q3-Q4 2026", "City Engineering"],
    },
    {
      id: "infra-006",
      title: "Street Lighting Expansion",
      subtitle: "LED conversion and safety lighting",
      tagLabel: "New",
      budget: 6_200_000,
      meta: ["City-wide", "Q1-Q2 2026", "General Services"],
    },
  ];
}

function buildLandingContent(): LandingContentVM {
  return {
    hero: {
      title: "Know Where Every Peso Goes.",
      subtitle:
        "Explore the Annual Investment Plan through clear budget breakdowns, sector allocations, and funded projects - presented with transparency and accountability.",
      ctaLabel: "Explore the AIP",
      ctaHrefOrAction: { type: "href", value: "/aips" },
    },
    manifesto: {
      eyebrow: "Public. Clear. Accountable.",
      lines: ["Every allocation.", "Every project.", "Every peso."],
      subtext: "Because public funds deserve public clarity.",
    },
    lguOverview: {
      lguName: "City of Cabuyao",
      scopeLabel: "City",
      fiscalYearLabel: "FY 2026",
      totalBudget: 1_200_000_000,
      budgetDeltaLabel: "+8% vs FY 2025",
      projectCount: 124,
      projectDeltaLabel: "+12 YoY",
      aipStatus: "Published",
      activeUsers: 2_430,
      map: {
        center: { lat: 14.272577955015906, lng: 121.12205388675164 },
        zoom: 13,
        markers: [
          {
            id: "mk-main",
            label: "City of Cabuyao",
            lat: 14.272577955015906,
            lng: 121.12205388675164,
            kind: "main",
            valueLabel: "PHP 1,200,000,000",
          },
          {
            id: "mk-1",
            label: "Brgy. Banay-banay",
            lat: 14.255193089069097,
            lng: 121.12779746799986,
            valueLabel: "PHP 320M",
          },
          {
            id: "mk-2",
            label: "Brgy. Pulo",
            lat: 14.249207085376085,
            lng: 121.1320126110115,
            valueLabel: "PHP 280M",
          },
          {
            id: "mk-3",
            label: "Brgy. San Isidro",
            lat: 14.242162608340106,
            lng: 121.14395166755374,
            valueLabel: "PHP 190M",
          },
          {
            id: "mk-4",
            label: "Brgy. Mamatid",
            lat: 14.237320473882946,
            lng: 121.15088301850722,
            valueLabel: "PHP 160M",
          },
        ],
      },
    },
    distribution: {
      total: 412_800_000,
      unitLabel: "M",
      sectors: [
        { key: "general", label: "General Services", amount: 120_000_000, percent: 29.1 },
        { key: "social", label: "Social Services", amount: 150_000_000, percent: 36.4 },
        { key: "economic", label: "Economic Services", amount: 90_000_000, percent: 21.8 },
        { key: "other", label: "Other Services", amount: 52_800_000, percent: 12.7 },
      ],
    },
    healthHighlights: {
      categoryKey: "health",
      heading: "Health Projects",
      description:
        "Track health-related investments from clinic upgrades to preventive care initiatives and emergency readiness.",
      totalBudget: 45_500_000,
      secondaryKpiLabel: "Beneficiary Target",
      secondaryKpiValue: 5_400,
      projects: buildHealthProjects(),
    },
    infraHighlights: {
      categoryKey: "infrastructure",
      heading: "Infrastructure Development",
      description:
        "Monitor infrastructure delivery from mobility upgrades to resilient public works and utility expansion.",
      totalBudget: 69_900_000,
      secondaryKpiLabel: "Project Sites",
      secondaryKpiValue: 36,
      projects: buildInfrastructureProjects(),
    },
    feedback: {
      trendSeries: [
        { label: "Jan", valueA: 18, valueB: 11 },
        { label: "Feb", valueA: 24, valueB: 13 },
        { label: "Mar", valueA: 31, valueB: 16 },
        { label: "Apr", valueA: 27, valueB: 15 },
        { label: "May", valueA: 34, valueB: 19 },
        { label: "Jun", valueA: 29, valueB: 17 },
      ],
      responseRate: 94,
      avgResponseTimeDays: 2.4,
    },
    chatPreview: {
      assistantName: "OpenAIP Assistant",
      sampleQuestion: "How much is allocated for health projects this year?",
      sampleAnswerLines: [
        "The current AIP earmarks PHP 45.5M for health-related projects.",
        "Top allocations include the Community Health Center Expansion and Mobile Clinic Fleet Upgrade.",
      ],
      suggestedPrompts: [
        "Show top funded infrastructure projects",
        "Compare sector allocations for 2025 vs 2026",
        "Which barangays receive the highest health funding?",
        "How fast are citizen feedback reports resolved?",
      ],
    },
    finalCta: {
      title: "Governance Made Visible.",
      subtitle: "Stay informed. Stay engaged. Shape transparent local governance.",
      ctaLabel: "View All AIP",
      ctaHrefOrAction: { type: "href", value: "/aips" },
    },
  };
}

export function createMockLandingContentRepo(): LandingContentRepo {
  return {
    async getLandingContent() {
      return buildLandingContent();
    },
  };
}
