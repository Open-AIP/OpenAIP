import type { LandingContentVM, ProjectCardVM } from "@/lib/domain/landing-content";
import type { LandingContentRepo } from "./repo";

function buildHealthProjects(): ProjectCardVM[] {
  return [
    {
      id: "health-001",
      title: "Community Health Center Expansion",
      subtitle: "Expansion of existing health facility to serve more residents.",
      tagLabel: "Health",
      budget: 45_000_000,
      imageSrc: "/citizen-dashboard/flag.jpg",
    },
    {
      id: "health-002",
      title: "Maternal and Child Wellness Network",
      subtitle: "Prenatal diagnostics, nutrition counseling, and postnatal home visits.",
      tagLabel: "Health",
      budget: 12_400_000,
      imageSrc: "/citizen-dashboard/city.png",
    },
    {
      id: "health-003",
      title: "Barangay Vaccination Cold Chain Upgrade",
      subtitle: "New vaccine storage units and transport coolers for rural health stations.",
      tagLabel: "Health",
      budget: 9_800_000,
      imageSrc: "/citizen-dashboard/school.png",
    },
    {
      id: "health-004",
      title: "Mobile Clinic Fleet Modernization",
      subtitle: "Retrofit mobile units with telemedicine stations for remote consultations.",
      tagLabel: "Health",
      budget: 7_600_000,
      imageSrc: "/citizen-dashboard/blue-rectangle.png",
    },
    {
      id: "health-005",
      title: "School Health and Nutrition Monitoring",
      subtitle: "Regular screenings and referral support for at-risk learners.",
      tagLabel: "Health",
      budget: 5_300_000,
      imageSrc: "/citizen-dashboard/navy-rectangle.png",
    },
    {
      id: "health-006",
      title: "Emergency Medical Stockpile Program",
      subtitle: "Citywide emergency medicine buffer for surge response readiness.",
      tagLabel: "Health",
      budget: 4_900_000,
      imageSrc: "/citizen-dashboard/gradient.png",
    },
  ];
}

function buildInfrastructureProjects(): ProjectCardVM[] {
  return [
    {
      id: "infra-001",
      title: "Primary Road Rehabilitation Program",
      subtitle: "Resurfacing and drainage upgrades on major city connectors.",
      tagLabel: "Infrastructure",
      budget: 15_200_000,
      imageSrc: "/citizen-dashboard/city.png",
    },
    {
      id: "infra-002",
      title: "Flood Control and Drainage Expansion",
      subtitle: "Additional culverts and drainage channels for flood-prone barangays.",
      tagLabel: "Infrastructure",
      budget: 12_800_000,
      imageSrc: "/citizen-dashboard/school.png",
    },
    {
      id: "infra-003",
      title: "Public School Facility Retrofit",
      subtitle: "Structural reinforcement and classroom upgrades in public schools.",
      tagLabel: "Infrastructure",
      budget: 11_350_000,
      imageSrc: "/citizen-dashboard/flag.jpg",
    },
    {
      id: "infra-004",
      title: "Waterline Network Extension",
      subtitle: "Pipeline extension to underserved communities and growth areas.",
      tagLabel: "Infrastructure",
      budget: 9_600_000,
      imageSrc: "/citizen-dashboard/blue-rectangle.png",
    },
    {
      id: "infra-005",
      title: "Bridge Reinforcement and Safety Works",
      subtitle: "Structural strengthening and safety rail improvements on city bridges.",
      tagLabel: "Infrastructure",
      budget: 14_750_000,
      imageSrc: "/citizen-dashboard/navy-rectangle.png",
    },
    {
      id: "infra-006",
      title: "Street Lighting Expansion",
      subtitle: "LED streetlight rollout to improve nighttime visibility and safety.",
      tagLabel: "Infrastructure",
      budget: 6_200_000,
      imageSrc: "/citizen-dashboard/gradient.png",
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
        "Strengthening healthcare access through facility improvements, equipment funding, and community health programs.",
      primaryKpiLabel: "Total Healthcare Budget",
      primaryKpiValue: 13_500_000,
      totalBudget: 45_500_000,
      secondaryKpiLabel: "Total Beneficiaries",
      secondaryKpiValue: 5_400,
      projects: buildHealthProjects(),
    },
    infraHighlights: {
      categoryKey: "infrastructure",
      heading: "Infrastructure Development",
      description:
        "Building roads, public facilities, and essential systems that support growth and daily life.",
      primaryKpiLabel: "Total Infrastructure Budget",
      primaryKpiValue: 69_900_000,
      totalBudget: 69_900_000,
      secondaryKpiLabel: "Total Projects",
      secondaryKpiValue: 36,
      projects: buildInfrastructureProjects(),
    },
    feedback: {
      title: "Your Voice Matters.",
      subtitle:
        "Track feedback trends and response performance to ensure continued accountability.",
      months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      series: [
        {
          key: "2020",
          label: "2020",
          points: [72, 78, 61, 90, 56, 54],
        },
        {
          key: "2021",
          label: "2021",
          points: [102, 172, 86, 124, 82, 140],
        },
      ],
      responseRate: 94,
      avgResponseTimeDays: 2.3,
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
