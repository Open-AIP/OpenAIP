"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { FileText, Pencil, TriangleAlert, X, RotateCw } from "lucide-react";
import type { AipDetail } from "@/types";
import { canEditAip, editLockedMessage, peso } from "@/feature/aips/utils";

function statusPill(status: AipDetail["status"]) {
  switch (status) {
    case "Published":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "For Revision":
      return "bg-amber-50 text-amber-800 border-amber-200";
    case "Under Review":
      return "bg-sky-50 text-sky-700 border-sky-200";
    case "Draft":
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
}

export default function AipDetailView({ 
  aip,
  onEdit,
  onResubmit,
  onCancel,
}: { 
  aip: AipDetail;
  onEdit?: () => void;
  onResubmit?: () => void;
  onCancel?: () => void;
}) {
  const editable = canEditAip(aip.status);
  const showFeedback = aip.status === "For Revision";

  const [sector, setSector] = useState<string>(aip.sectors[0] ?? "All");  const [query, setQuery] = useState<string>("");

  const breadcrumb = [
    { label: "AIP Management", href: "/barangay/aips" },
    { label: aip.title, href: "#" },
  ];

  return (
    <div className="space-y-6">
      {/* breadcrumb */}
      <div className="text-xs text-slate-400">
        {breadcrumb.map((b, idx) => (
          <span key={b.label}>
            {idx > 0 ? " / " : ""}
            {b.href !== "#" ? (
              <Link href={b.href} className="hover:text-slate-600">
                {b.label}
              </Link>
            ) : (
              <span>{b.label}</span>
            )}
          </span>
        ))}
      </div>

      {/* title bar */}
      <Card className="border-slate-200">
        <CardContent className="p-6 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-slate-900">
            {aip.title} <span className="ml-2">{aip.year}</span>
          </h1>

          <Badge variant="outline" className={`rounded-full ${statusPill(aip.status)}`}>
            {aip.status}
          </Badge>
        </CardContent>
      </Card>

      {/* AIP Document */}
      <Card className="border-slate-200">
        <CardHeader className="pb-0">
          <div className="flex items-center gap-2 text-slate-900 font-semibold">
            <FileText className="h-4 w-4 text-slate-500" />
            AIP Document
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="border border-slate-200 rounded-lg bg-slate-50 p-8 flex flex-col items-center justify-center gap-4 text-center">
            <div className="h-12 w-12 rounded-lg bg-white border border-slate-200 grid place-items-center">
              <FileText className="h-6 w-6 text-slate-400" />
            </div>
            <div className="text-sm text-slate-600">{aip.fileName}</div>

            <Button variant="outline" disabled={!aip.pdfUrl} asChild={!!aip.pdfUrl}>
              {aip.pdfUrl ? (
                <a href={aip.pdfUrl} target="_blank" rel="noreferrer">
                  View PDF
                </a>
              ) : (
                <span>View PDF</span>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary + Detailed Description */}
      <Card className="border-slate-200">
        <CardContent className="p-6 space-y-6">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Summary</h2>
            <p className="mt-2 text-sm text-slate-600">{aip.summaryText}</p>
          </div>

          <div>
            <h3 className="text-base font-semibold text-slate-900">Detailed Description</h3>
            <p className="mt-2 text-sm text-slate-600">
              This comprehensive infrastructure plan addresses the critical needs of our growing barangay community:
            </p>

            <ol className="mt-3 list-decimal pl-5 space-y-1 text-sm text-slate-600">
              {aip.detailedBullets.map((b: string, index: number) => (
                <li key={index}>{b}</li>
              ))}
            </ol>

            <p className="mt-4 text-sm text-slate-600">
              These projects will significantly improve the quality of life and accessibility for all residents.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* AIP Details (table preview) */}
      <Card className="border-slate-200">
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h3 className="text-base font-semibold text-slate-900">
              Annual Investment Plan {aip.year} Details
            </h3>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="space-y-1">
                <div className="text-[11px] text-slate-400 text-center sm:text-left">
                  Filter by Sector
                </div>
                <Select value={sector} onValueChange={setSector}>
                  <SelectTrigger className="w-[180px] bg-slate-50 border-slate-200">
                    <SelectValue placeholder="Sectors" />
                  </SelectTrigger>
                  <SelectContent>
                    {aip.sectors.map((s: string) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <div className="text-[11px] text-slate-400 text-center sm:text-left">
                  Search Projects
                </div>
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by project name or keyword"
                  className="w-[240px] bg-slate-50 border-slate-200"
                />
              </div>
            </div>
          </div>

          {/* Table preview area */}
          <div className="border border-slate-200 rounded-lg bg-white overflow-hidden">
            <div className="h-[280px] w-full bg-slate-50 grid place-items-center text-sm text-slate-400">
              {aip.tablePreviewUrl ? (
                <img
                  src={aip.tablePreviewUrl}
                  alt="AIP table preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>Table preview placeholder (add tablePreviewUrl)</span>
              )}
            </div>
          </div>

          {!editable && !showFeedback && (
            <Alert className="border-slate-200 bg-sky-50">
              <TriangleAlert className="h-4 w-4 text-sky-700" />
              <AlertDescription className="text-sky-800">
                {editLockedMessage(aip.status)}
              </AlertDescription>
            </Alert>
          )}

          {showFeedback && (
            <div className="mt-4 p-4 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm">
              <strong>Feedback for Revision:</strong>
              <p className="mt-1">{aip.feedback}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Uploader info */}
      <Card className="border-slate-200">
        <CardContent className="p-6">
          <h3 className="text-base font-semibold text-slate-900">Uploader Information</h3>

          <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-y-3 text-sm">
            <div className="flex gap-2">
              <dt className="text-slate-500 w-28">Name:</dt>
              <dd className="text-slate-800">{aip.uploader.name}</dd>
            </div>

            <div className="flex gap-2">
              <dt className="text-slate-500 w-28">Role:</dt>
              <dd className="text-slate-800">{aip.uploader.role}</dd>
            </div>

            <div className="flex gap-2">
              <dt className="text-slate-500 w-28">Upload Date:</dt>
              <dd className="text-slate-800">{aip.uploader.uploadDate}</dd>
            </div>

            <div className="flex gap-2">
              <dt className="text-slate-500 w-28">Budget Allocated:</dt>
              <dd className="text-slate-800 font-semibold text-[#022437]">
                {peso(aip.uploader.budgetAllocated)}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

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
        {aip.status === "Draft" && (
          <Button variant="destructive" onClick={onCancel} disabled={!onCancel}>
            <X className="h-4 w-4" />
            Cancel Submission
          </Button>
        )}
      </div>
    </div>
  );
}
