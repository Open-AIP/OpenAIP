"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Pencil, RotateCw, X } from "lucide-react";

import type { AipHeader } from "../types";
import { BreadcrumbNav } from "@/components/layout/breadcrumb-nav";
import { getAipStatusBadgeClass } from "../utils";
import { AipPdfContainer } from "../components/aip-pdf-container";
import { AipDetailsSummary } from "../components/aip-details-summary";
import { AipUploaderInfo } from "../components/aip-uploader-info";
import { RemarksCard } from "../components/remarks-card";
import { AipDetailsTableView } from "./aip-details-table";
import type { AipProjectRepo } from "../data/aip-project-repo";
import { Send } from "lucide-react";
import { CommentThreadPanel } from "@/features/feedback";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AipDetailView({
  aip,
  scope = "barangay",
  projectRepo,
  onEdit,
  onResubmit,
  onCancel,
  onCancelSubmission,
  onSubmit,
}: {
  aip: AipHeader;
  scope?: "city" | "barangay";
  projectRepo: AipProjectRepo;
  onEdit?: () => void;
  onResubmit?: () => void;
  onCancel?: () => void;
  onCancelSubmission?: () => void;
  onSubmit?: () => void;
}) {
  const showFeedback = aip.status === "for_revision";
  const showRemarks = aip.status !== "draft";
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const focusedRowId = searchParams.get("focus") ?? undefined;
  const threadId = searchParams.get("thread");
  const tab = searchParams.get("tab");
  const activeTab = tab === "comments" ? "comments" : "summary";

  const breadcrumb = [
    { label: "AIP Management", href: `/${scope}/aips` },
    { label: aip.title, href: "#" },
  ];

  return (
    <div className="space-y-6">
      <BreadcrumbNav items={breadcrumb} />

      {/* title bar */}
      <Card className="border-slate-200">
        <CardContent className="p-6 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-slate-900">
            {aip.title} <span className="ml-2">{aip.year}</span>
          </h1>

          <Badge variant="outline" className={`rounded-full ${getAipStatusBadgeClass(aip.status)}`}>
            {aip.status}
          </Badge>
        </CardContent>
      </Card>

      <div className={showRemarks ? "grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]" : "space-y-6"}>
        <div className="space-y-6">
          <AipPdfContainer aip={aip} />

          <div className="flex items-center gap-3">
            <Tabs
              value={activeTab}
              onValueChange={(value) => {
                const params = new URLSearchParams(searchParams.toString());
                if (value === "comments") {
                  params.set("tab", "comments");
                } else {
                  params.delete("tab");
                  params.delete("thread");
                }
                const query = params.toString();
                router.replace(query ? `${pathname}?${query}` : pathname, {
                  scroll: false,
                });
              }}
            >
              <TabsList className="h-10 gap-2 bg-transparent p-0">
                <TabsTrigger
                  value="summary"
                  className="h-9 rounded-lg px-4 text-sm font-medium text-slate-500 data-[state=active]:border data-[state=active]:border-slate-200 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
                >
                  Summary
                </TabsTrigger>
                <TabsTrigger
                  value="comments"
                  className="h-9 rounded-lg px-4 text-sm font-medium text-slate-500 data-[state=active]:border data-[state=active]:border-slate-200 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
                >
                  Feedback
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {activeTab === "summary" ? (
            <>
              <AipDetailsSummary aip={aip} scope={scope} />

              <AipDetailsTableView
                aipId={aip.id}
                year={aip.year}
                repo={projectRepo}
                aipStatus={aip.status}
                focusedRowId={focusedRowId}
              />

              <AipUploaderInfo aip={aip} />
            </>
          ) : (
            <div className="space-y-6">
              {threadId ? <CommentThreadPanel threadId={threadId} /> : null}
            </div>
          )}

          {/* Bottom action */}
          <div className="flex justify-end gap-3">
            {showFeedback && (
              <>
                <Button variant="outline" onClick={onEdit} disabled={!onEdit}>
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
                <Button className="bg-teal-600 hover:bg-teal-700" onClick={onResubmit} disabled={!onResubmit}>
                  <RotateCw className="h-4 w-4" />
                  Resubmit
                </Button>
              </>
            )}

            {aip.status === "draft" && (
              <>
                <Button variant="outline" onClick={onCancel} disabled={!onCancel}>
                  <X className="h-4 w-4" />
                  Cancel Draft
                </Button>
                <Button className="bg-[#022437] hover:bg-[#022437]/90" onClick={onSubmit} disabled={!onSubmit}>
                  <Send className="h-4 w-4" />
                  Submit for Review
                </Button>
              </>
            )}
          </div>
        </div>

        {showRemarks ? (
          <div className="lg:sticky lg:top-6 h-fit">
            <RemarksCard
              status={aip.status}
              reviewerMessage={aip.feedback}
              onCancelSubmission={onCancelSubmission ?? onCancel}
              onResubmit={onResubmit}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
