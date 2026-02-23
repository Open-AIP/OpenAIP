export type LandingCtaTarget =
  | { type: "href"; value: string }
  | { type: "action"; value: string };

export type LandingHeroVM = {
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHrefOrAction: LandingCtaTarget;
};

export type LandingManifestoVM = {
  eyebrow: string;
  lines: string[];
  subtext: string;
};

export type LguOverviewMarkerVM = {
  id: string;
  label: string;
  note?: string;
};

export type LguOverviewVM = {
  lguName: string;
  fiscalYear: number;
  totalBudget: number;
  projectCount: number;
  aipStatus: string;
  activeUsers: number;
  markers: LguOverviewMarkerVM[];
};

export type SectorDistributionItemVM = {
  key: string;
  label: string;
  amount: number;
  percent: number;
};

export type SectorDistributionVM = {
  sectors: SectorDistributionItemVM[];
  totalAmount: number;
};

export type ProjectCardVM = {
  id: string;
  title: string;
  subtitle: string;
  tagLabel: string;
  budget: number;
  meta: string[];
};

export type ProjectHighlightVM = {
  categoryKey: string;
  heading: string;
  description: string;
  totalBudget: number;
  secondaryKpiLabel: string;
  secondaryKpiValue: number;
  projects: ProjectCardVM[];
};

export type FeedbackTrendPointVM = {
  label: string;
  valueA: number;
  valueB?: number;
};

export type FeedbackSnapshotVM = {
  trendSeries: FeedbackTrendPointVM[];
  responseRate: number;
  avgResponseTimeDays: number;
};

export type ChatPreviewVM = {
  assistantName: string;
  sampleQuestion: string;
  sampleAnswerLines: string[];
  suggestedPrompts: string[];
};

export type LandingFinalCtaVM = {
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHrefOrAction: LandingCtaTarget;
};

export type LandingContentVM = {
  hero: LandingHeroVM;
  manifesto: LandingManifestoVM;
  lguOverview: LguOverviewVM;
  distribution: SectorDistributionVM;
  healthHighlights: ProjectHighlightVM;
  infraHighlights: ProjectHighlightVM;
  feedback: FeedbackSnapshotVM;
  chatPreview: ChatPreviewVM;
  finalCta: LandingFinalCtaVM;
};

