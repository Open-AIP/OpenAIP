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

export type LguOverviewMapMarkerVM = {
  id: string;
  label: string;
  lat: number;
  lng: number;
  kind?: string;
  valueLabel?: string;
};

export type LguOverviewMapVM = {
  center: { lat: number; lng: number };
  zoom: number;
  markers: LguOverviewMapMarkerVM[];
};

export type LguOverviewVM = {
  lguName: string;
  scopeLabel: string;
  fiscalYearLabel: string;
  totalBudget: number;
  budgetDeltaLabel?: string;
  projectCount: number;
  projectDeltaLabel?: string;
  aipStatus: string;
  activeUsers: number;
  map: LguOverviewMapVM;
};

export type SectorDistributionItemVM = {
  key: string;
  label: string;
  amount: number;
  percent: number;
};

export type SectorDistributionVM = {
  total: number;
  unitLabel?: string;
  sectors: SectorDistributionItemVM[];
};

export type ProjectCardVM = {
  id: string;
  title: string;
  subtitle: string;
  tagLabel: string;
  budget: number;
  budgetLabel?: string;
  imageSrc: string;
  meta?: string[];
};

export type ProjectHighlightVM = {
  heading: string;
  description: string;
  primaryKpiLabel: string;
  primaryKpiValue: number;
  secondaryKpiLabel: string;
  secondaryKpiValue: number;
  projects: ProjectCardVM[];
  categoryKey?: string;
  totalBudget?: number;
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
