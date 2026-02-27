"use client";

import { AlertCircle, Clock3, FileText, FolderOpen, MessageSquare, UserCheck, Wallet, Zap } from "lucide-react";
import KpiCard from "@/components/kpi-card";

export function CityDashboardKpiExamples() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <KpiCard
        variant="split"
        label="Pending Review"
        value={18}
        subtext="As of today"
        icon={<AlertCircle className="h-5 w-5" />}
        accent="orange"
        accentMode="value"
      />
      <KpiCard
        variant="split"
        label="Under Review"
        value={9}
        subtext="As of today"
        icon={<Clock3 className="h-5 w-5" />}
        accent="blue"
        accentMode="value"
      />
      <KpiCard
        variant="split"
        label="For Revision"
        value={6}
        subtext="As of today"
        icon={<FileText className="h-5 w-5" />}
        accent="orange"
        accentMode="value"
      />
      <KpiCard
        variant="split"
        label="Available to Claim"
        value={18}
        subtext="Ready for review"
        icon={<UserCheck className="h-5 w-5" />}
        accent="green"
        accentMode="value"
      />
      <KpiCard
        variant="split"
        label="Oldest Pending"
        value={14}
        subtext="days in queue"
        icon={<Zap className="h-5 w-5" />}
        accent="slate"
        accentMode="value"
      />
    </div>
  );
}

export function BarangayDashboardKpiExamples() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        variant="status"
        label="AIP Status"
        value="Draft"
        subtext="5 days in current status"
        meta="Last updated: 2026-02-14 14:30"
        icon={<FileText className="h-4 w-4" />}
        accent="orange"
        accentMode="border"
      />
      <KpiCard
        variant="split"
        label="Total Projects"
        value={28}
        subtext="Health: 12 | Infra: 16"
        icon={<FolderOpen className="h-5 w-5" />}
        accent="blue"
        accentMode="border"
      />
      <KpiCard
        variant="split"
        label="Total Budget"
        value="PHP 11,100,000"
        subtext="Based on project totals for 2026"
        icon={<Wallet className="h-5 w-5" />}
        accent="green"
        accentMode="border"
      />
      <KpiCard
        variant="split"
        label="Citizen Feedback"
        value="24 Comments"
        subtext="Unreplied: 7 | Hidden: 2"
        icon={<MessageSquare className="h-5 w-5" />}
        accent="orange"
        accentMode="border"
        badge={{ text: "Action Required", accent: "orange" }}
      />
    </div>
  );
}

export default function DashboardKpiCardUsageExamples() {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-700">City Dashboard KPIs</h3>
        <CityDashboardKpiExamples />
      </div>
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-700">Barangay Dashboard KPIs</h3>
        <BarangayDashboardKpiExamples />
      </div>
    </section>
  );
}
