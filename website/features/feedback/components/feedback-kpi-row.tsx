"use client";

import KpiCard from "@/components/kpi-card";
import type { FeedbackKpiCounts } from "../hooks";
import {
  AlertCircle,
  CheckCircle,
  CircleHelp,
  Edit,
  MessageSquare,
} from "lucide-react";

export function FeedbackKpiRow({ counts }: { counts: FeedbackKpiCounts }) {
  const cardClassName = "grid gap-4 sm:grid-cols-2 lg:grid-cols-5";
  const subtext = "Across selected filters";

  return (
    <div className={cardClassName}>
      <KpiCard
        variant="split"
        label="Total Comments"
        value={counts.total}
        subtext={subtext}
        icon={<MessageSquare className="h-5 w-5" strokeWidth={2.2} />}
        accent="slate"
        accentMode="value"
      />
      <KpiCard
        variant="split"
        label="Commendation"
        value={counts.commend}
        subtext={subtext}
        icon={<CheckCircle className="h-5 w-5" strokeWidth={2.2} />}
        accent="green"
        accentMode="value"
      />
      <KpiCard
        variant="split"
        label="Suggestion"
        value={counts.suggestion}
        subtext={subtext}
        icon={<Edit className="h-5 w-5" strokeWidth={2.2} />}
        accent="yellow"
        accentMode="value"
      />
      <KpiCard
        variant="split"
        label="Question"
        value={counts.question}
        subtext={subtext}
        icon={<CircleHelp className="h-5 w-5" strokeWidth={2.2} />}
        accent="blue"
        accentMode="value"
      />
      <KpiCard
        variant="split"
        label="Concern"
        value={counts.concern}
        subtext={subtext}
        icon={<AlertCircle className="h-5 w-5" strokeWidth={2.2} />}
        accent="orange"
        accentMode="value"
      />
    </div>
  );
}
