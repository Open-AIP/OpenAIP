import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardHeader, DateCard, WorkingOnCard } from "@/features/dashboard/components/dashboard-header-widgets";
import { KpiRow } from "@/features/dashboard/components/dashboard-metric-cards";
import { BudgetBreakdownSection } from "@/features/dashboard/components/dashboard-budget-allocation";
import { TopFundedProjectsSection } from "@/features/dashboard/components/dashboard-projects-overview";
import { AipCoverageCard, PublicationTimelineCard, AipsByYearTable } from "@/features/dashboard/components/dashboard-aip-publication-status";
import { CitizenEngagementPulseColumn } from "@/features/dashboard/components/dashboard-feedback-insights";
import { RecentActivityFeed, RecentProjectUpdatesCard } from "@/features/dashboard/components/dashboard-activity-updates";
import { replyBarangayFeedbackAction, createBarangayDraftAipAction } from "@/features/dashboard/actions/barangay-dashboard-actions";
import type { DashboardData, DashboardQueryState, DashboardViewModel } from "@/features/dashboard/types/dashboard-types";

function toCurrency(value: number): string {
  return value.toLocaleString("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 });
}

export function BarangayDashboardPage({
  data,
  vm,
  queryState,
}: {
  data: DashboardData;
  vm: DashboardViewModel;
  queryState: DashboardQueryState;
}) {
  const today = new Date().toLocaleDateString("en-PH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const totalAips = data.allAips.length;
  const pendingReviewCount = data.allAips.filter((aip) => aip.status === "pending_review").length;
  const underReviewCount = data.allAips.filter((aip) => aip.status === "under_review").length;
  const forRevisionCount = data.allAips.filter((aip) => aip.status === "for_revision").length;

  const publicationYears = data.allAips
    .map((aip) => aip.fiscalYear)
    .sort((left, right) => right - left)
    .slice(0, 5)
    .map((year) => ({ year, count: data.allAips.filter((aip) => aip.fiscalYear === year && aip.status === "published").length }));

  return (
    <div className="space-y-6">
      <DashboardHeader title="Welcome to OpenAIP" subtitle="Barangay AIP operations, workflow, and citizen engagement pulse." />

      <form method="get" className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_180px_180px_140px]">
        <input name="q" defaultValue={queryState.q} placeholder="Global search: project, ref code, program name" className="h-9 rounded-md border border-slate-200 px-3 text-sm" />
        <select name="year" defaultValue={String(data.selectedFiscalYear)} className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm">
          {(data.availableFiscalYears.length > 0 ? data.availableFiscalYears : [data.selectedFiscalYear]).map((year) => <option key={year} value={year}>{year}</option>)}
        </select>
        <select name="kpi" defaultValue={queryState.kpiMode} className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"><option value="summary">Summary KPIs</option><option value="operational">Operational KPIs</option></select>
        <Button type="submit" className="bg-[#0B6477] hover:bg-[#095565]">Apply</Button>
      </form>

      {!data.selectedAip ? (
        <Card className="border-slate-200 py-0 shadow-sm">
          <CardHeader><CardTitle className="text-xl">No AIP for {data.selectedFiscalYear}</CardTitle></CardHeader>
          <CardContent className="space-y-4 pb-6">
            <p className="text-sm text-slate-600">There is no barangay AIP record for fiscal year {data.selectedFiscalYear}. You can create a draft if policy permits.</p>
            <form action={createBarangayDraftAipAction} className="flex items-center gap-3">
              <input type="hidden" name="fiscalYear" value={data.selectedFiscalYear} />
              <Button type="submit" className="bg-[#0B6477] hover:bg-[#095565]">Create Draft AIP</Button>
              <Link href="/barangay/aips" className="text-sm text-[#0B6477] underline underline-offset-2">Open AIP Management</Link>
            </form>
          </CardContent>
        </Card>
      ) : (
        <>
          <KpiRow selectedAip={data.selectedAip} totalProjects={vm.projects.length} totalBudget={toCurrency(vm.totalBudget)} missingTotalCount={vm.missingTotalCount} citizenFeedbackCount={vm.citizenFeedbackCount} awaitingReplyCount={vm.awaitingReplyCount} mode={queryState.kpiMode} pendingReviewCount={pendingReviewCount} underReviewCount={underReviewCount} forRevisionCount={forRevisionCount} totalAips={totalAips} oldestPendingDays={vm.oldestPendingDays} />

          <div className="grid gap-4 xl:grid-cols-[1.95fr_1fr]">
            <BudgetBreakdownSection totalBudget={toCurrency(vm.totalBudget)} items={vm.budgetBySector} detailsHref={`/barangay/aips/${data.selectedAip.id}`} />
            <div className="space-y-4"><DateCard label={today} /><WorkingOnCard items={vm.workingOnItems} /></div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.95fr_1fr]">
            <TopFundedProjectsSection queryState={queryState} selectedFiscalYear={data.selectedFiscalYear} sectors={data.sectors} rows={vm.topFundedFiltered} />
            <RecentProjectUpdatesCard flaggedProjects={vm.flaggedProjects} failedPipelineStages={vm.failedPipelineStages} editableSummary={data.selectedAip.status === "draft" || data.selectedAip.status === "for_revision" ? "Project edits and PDF replacement are allowed." : "Project edits and PDF replacement are locked in this status."} financialSummary={toCurrency(vm.projects.reduce((sum, project) => sum + (project.personalServices ?? 0) + (project.maintenanceAndOtherOperatingExpenses ?? 0) + (project.capitalOutlay ?? 0), 0))} />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="space-y-4">
              <AipCoverageCard selectedAip={data.selectedAip} />
              <PublicationTimelineCard years={publicationYears} />
              <AipsByYearTable rows={data.allAips} />
            </div>
            <CitizenEngagementPulseColumn newThisWeek={vm.newThisWeek} awaitingReply={vm.awaitingReplyCount} lguNotesPosted={vm.lguNotesPosted} feedbackTrend={vm.feedbackTrend} feedbackTargets={vm.feedbackTargets} recentFeedback={vm.recentCitizenFeedback} replyAction={replyBarangayFeedbackAction} />
          </div>

          <RecentActivityFeed runs={data.latestRuns} />
        </>
      )}
    </div>
  );
}
