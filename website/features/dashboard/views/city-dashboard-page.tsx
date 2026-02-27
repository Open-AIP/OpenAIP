import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardHeader, DateCard, WorkingOnCard } from "@/features/dashboard/components/dashboard-header-widgets";
import { KpiRow } from "@/features/dashboard/components/dashboard-metric-cards";
import { BudgetBreakdownSection } from "@/features/dashboard/components/dashboard-budget-allocation";
import { TopFundedProjectsSection } from "@/features/dashboard/components/dashboard-projects-overview";
import { AipStatusColumn, AipCoverageCard, PublicationTimelineCard, AipsByYearTable } from "@/features/dashboard/components/dashboard-aip-publication-status";
import { CitizenEngagementPulseColumn } from "@/features/dashboard/components/dashboard-feedback-insights";
import { RecentActivityFeed, RecentProjectUpdatesCard } from "@/features/dashboard/components/dashboard-activity-updates";
import { createCityDraftAipAction, replyCityFeedbackAction } from "@/features/dashboard/actions/city-dashboard-actions";
import type { DashboardData, DashboardQueryState, DashboardViewModel } from "@/features/dashboard/types/dashboard-types";

function toCurrency(value: number): string {
  return value.toLocaleString("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 });
}

export function CityDashboardPage({
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
      <DashboardHeader
        title="Welcome to OpenAIP"
        q={queryState.q}
        tableQ={queryState.tableQ}
        tableCategory={queryState.tableCategory}
        tableSector={queryState.tableSector}
        selectedFiscalYear={data.selectedFiscalYear}
        availableFiscalYears={data.availableFiscalYears}
        kpiMode={queryState.kpiMode}
      />

      {!data.selectedAip ? (
        <Card className="border-slate-200 py-0 shadow-sm">
          <CardHeader><CardTitle className="text-xl">No AIP for {data.selectedFiscalYear}</CardTitle></CardHeader>
          <CardContent className="space-y-4 pb-6">
            <p className="text-sm text-slate-600">There is no city AIP record for fiscal year {data.selectedFiscalYear}. You can create a draft if policy permits.</p>
            <form action={createCityDraftAipAction} className="flex items-center gap-3">
              <input type="hidden" name="fiscalYear" value={data.selectedFiscalYear} />
              <Button type="submit" className="bg-[#0B6477] hover:bg-[#095565]">Create Draft AIP</Button>
              <Link href="/city/aips" className="text-sm text-[#0B6477] underline underline-offset-2">Open AIP Management</Link>
            </form>
          </CardContent>
        </Card>
      ) : (
        <>
          <KpiRow selectedAip={data.selectedAip} totalProjects={vm.projects.length} totalBudget={toCurrency(vm.totalBudget)} missingTotalCount={vm.missingTotalCount} citizenFeedbackCount={vm.citizenFeedbackCount} awaitingReplyCount={vm.awaitingReplyCount} mode={queryState.kpiMode} pendingReviewCount={pendingReviewCount} underReviewCount={underReviewCount} forRevisionCount={forRevisionCount} totalAips={totalAips} oldestPendingDays={vm.oldestPendingDays} />

          <div className="grid gap-4 xl:grid-cols-[1.95fr_1fr]">
            <BudgetBreakdownSection totalBudget={toCurrency(vm.totalBudget)} items={vm.budgetBySector} detailsHref={`/city/aips/${data.selectedAip.id}`} />
            <div className="space-y-4"><DateCard label={today} /><WorkingOnCard items={vm.workingOnItems} /></div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.95fr_1fr]">
            <TopFundedProjectsSection queryState={queryState} sectors={data.sectors} projects={vm.projects} />
            <AipStatusColumn statusDistribution={vm.statusDistribution} pendingReviewAging={vm.pendingReviewAging} />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="space-y-4">
              <h2 className="text-4xl font-semibold text-slate-900">City AIP Status</h2>
              <AipCoverageCard selectedAip={data.selectedAip} />
              <PublicationTimelineCard years={publicationYears} />
              <AipsByYearTable rows={data.allAips} basePath="/city" />
            </div>
            <CitizenEngagementPulseColumn newThisWeek={vm.newThisWeek} awaitingReply={vm.awaitingReplyCount} lguNotesPosted={vm.lguNotesPosted} feedbackTrend={vm.feedbackTrend} feedbackTargets={vm.feedbackTargets} recentFeedback={vm.recentCitizenFeedback} replyAction={replyCityFeedbackAction} />
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,420px)] xl:items-stretch">
            <div className="min-w-0">
              <RecentActivityFeed runs={data.latestRuns} auditHref="/city/audit" />
            </div>
            <div className="min-w-0 flex flex-col items-stretch">
              <RecentProjectUpdatesCard flaggedProjects={vm.flaggedProjects} failedPipelineStages={vm.failedPipelineStages} editableSummary={data.selectedAip.status === "draft" || data.selectedAip.status === "for_revision" ? "Project edits and PDF replacement are allowed." : "Project edits and PDF replacement are locked in this status."} financialSummary={toCurrency(vm.projects.reduce((sum, project) => sum + (project.personalServices ?? 0) + (project.maintenanceAndOtherOperatingExpenses ?? 0) + (project.capitalOutlay ?? 0), 0))} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
