"use client";

import { useState } from "react";
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
import { canEditAip } from "../utils";
import { AipDetailsTableView } from "./aip-details-table";
import { createMockAipProjectRepo } from "../services/aip-project-repo.mock";
import { Send } from "lucide-react";

const projectRepo = createMockAipProjectRepo();


export default function AipDetailView({
  aip,
  scope = "barangay",
  onEdit,
  onResubmit,
  onCancel,
  onSubmit,
}: {
  aip: AipHeader;
  scope?: "city" | "barangay";
  onEdit?: () => void;
  onResubmit?: () => void;
  onCancel?: () => void;
  onSubmit?: () => void;
}) {
  const editable = canEditAip(aip.status);
  const showFeedback = aip.status === "for_revision";

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

      <AipPdfContainer aip={aip} />

      <AipDetailsSummary aip={aip} scope={scope} />

      <AipDetailsTableView aipId={aip.id} year={aip.year} repo={projectRepo} aipStatus={aip.status} />

      <AipUploaderInfo aip={aip} />

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
  );
}
