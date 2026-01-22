"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Upload } from "lucide-react";
import { BreadcrumbNav } from "@/components/layout/breadcrumb-nav";

type ProjectKind = "health" | "infrastructure";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type UploaderInfo = {
  name: string;
  position: string;
  office: string;
};

type ProjectInfo = {
  month?: string;
  year?: string;
  name?: string;
  description?: string;
  implementingOffice?: string;
  fundingSource?: string;
};

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const YEARS = Array.from({ length: 6 }).map((_, i) => String(2024 + i));

const HEALTH_STATUSES = ["Ongoing", "Planning", "Completed", "On Hold"] as const;
const INFRA_STATUSES  = ["Ongoing", "Planning", "Completed", "On Hold"] as const;

export default function AddInformationPage({
  kind,
  breadcrumb,
  uploader,
  projectInfo,
}: {
  kind: ProjectKind;
  breadcrumb: BreadcrumbItem[];
  uploader: UploaderInfo;
  projectInfo?: ProjectInfo;
}) {
  const router = useRouter();

  // shared
  const [photoFile, setPhotoFile] = React.useState<File | null>(null);

  // health fields - initialize with projectInfo if provided
  const [month, setMonth] = React.useState<string>(projectInfo?.month || "");
  const [year, setYear] = React.useState<string>(projectInfo?.year || "");
  const [healthName, setHealthName] = React.useState<string>(projectInfo?.name || "");
  const [healthDesc, setHealthDesc] = React.useState<string>(projectInfo?.description || "");
  const [totalTarget, setTotalTarget] = React.useState<string>("");
  const [targetParticipants, setTargetParticipants] = React.useState<string>("");
  const [budgetAllocated, setBudgetAllocated] = React.useState<string>("");
  const [implementingOffice, setImplementingOffice] = React.useState<string>(projectInfo?.implementingOffice || "");
  const [healthStatus, setHealthStatus] = React.useState<string>("");

  // infra fields - initialize with projectInfo if provided
  const [startDate, setStartDate] = React.useState<string>("");
  const [targetCompletionDate, setTargetCompletionDate] = React.useState<string>("");
  const [infraName, setInfraName] = React.useState<string>(projectInfo?.name || "");
  const [infraDesc, setInfraDesc] = React.useState<string>(projectInfo?.description || "");
  const [infraOffice, setInfraOffice] = React.useState<string>(projectInfo?.implementingOffice || "");
  const [fundingSource, setFundingSource] = React.useState<string>(projectInfo?.fundingSource || "");
  const [contractorName, setContractorName] = React.useState<string>("");
  const [contractCost, setContractCost] = React.useState<string>("");
  const [infraStatus, setInfraStatus] = React.useState<string>("");

  function onDone() {
    // For now: mock submit. Later you'll replace with Supabase insert/update.
    const payload =
      kind === "health"
        ? {
            kind,
            photoFileName: photoFile?.name ?? null,
            month,
            year,
            name: healthName,
            description: healthDesc,
            totalTargetParticipants: totalTarget,
            targetParticipants,
            budgetAllocated,
            implementingOffice,
            status: healthStatus,
          }
        : {
            kind,
            photoFileName: photoFile?.name ?? null,
            startDate,
            targetCompletionDate,
            name: infraName,
            description: infraDesc,
            implementingOffice: infraOffice,
            fundingSource,
            contractorName,
            contractCost,
            status: infraStatus,
          };

    console.log("ADD INFO SUBMIT:", payload);

    // UX: go back to detail page
    router.back();
  }

  function requiredOk() {
    if (kind === "health") {
      // Disabled fields (from projectInfo): month, year, healthName, healthDesc, implementingOffice
      // Only validate these if projectInfo is not provided (fields are editable)
      const disabledFieldsValid = projectInfo 
        ? true 
        : (month && year && healthName.trim() && healthDesc.trim() && implementingOffice);
      
      return (
        disabledFieldsValid &&
        totalTarget &&
        targetParticipants.trim() &&
        budgetAllocated &&
        healthStatus
      );
    }
    // Infrastructure
    // Disabled fields (from projectInfo): infraName, infraDesc, infraOffice, fundingSource
    // Only validate these if projectInfo is not provided (fields are editable)
    const disabledFieldsValid = projectInfo
      ? true
      : (infraName.trim() && infraDesc.trim() && infraOffice && fundingSource);
    
    return (
      disabledFieldsValid &&
      startDate &&
      targetCompletionDate &&
      contractorName.trim() &&
      contractCost &&
      infraStatus
    );
  }

  return (
    <div className="space-y-6">
      <BreadcrumbNav items={breadcrumb} />

      <div>
        <h1 className="text-3xl font-bold text-slate-900">Add Information</h1>
      </div>

      {/* Project Information */}
      <Card className="border-slate-200">
        <CardContent className="p-6 space-y-6">
          <div className="text-lg font-semibold text-slate-900">Project Information</div>

          {/* Photo Upload */}
          <div className="space-y-2">
            <Label>Project Photo</Label>
            <label className="block cursor-pointer">
              <input
                className="hidden"
                type="file"
                accept="image/png,image/jpeg"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  if (file && file.size > 5 * 1024 * 1024) {
                    alert("File size must be under 5MB");
                    return;
                  }
                  setPhotoFile(file);
                }}
              />              <div className="rounded-xl border border-slate-200 bg-white p-10 text-center hover:bg-slate-50 transition">
                <div className="mx-auto h-12 w-12 rounded-xl border border-slate-200 bg-slate-50 grid place-items-center">
                  <Upload className="h-6 w-6 text-slate-400" />
                </div>
                <div className="mt-3 text-sm text-slate-600">
                  {photoFile ? photoFile.name : "Click to upload image"}
                </div>
                <div className="mt-1 text-xs text-slate-400">PNG, JPG up to 5MB</div>
              </div>
            </label>
          </div>

          {/* HEALTH FORM */}
          {kind === "health" ? (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Month *</Label>
                  <Select value={month} onValueChange={setMonth} disabled>
                    <SelectTrigger className="h-11 w-full bg-slate-50 border-slate-200">
                      <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Year *</Label>
                  <Select value={year} onValueChange={setYear} disabled>
                    <SelectTrigger className="h-11 w-full bg-slate-50 border-slate-200">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {YEARS.map((y) => (
                        <SelectItem key={y} value={y}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Health Project Name *</Label>
                <Input
                  className="h-11 w-full bg-slate-50 border-slate-200"
                  placeholder="Enter project name"
                  value={healthName}
                  onChange={(e) => setHealthName(e.target.value)}
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label>Program Description *</Label>
                <Textarea
                  className="bg-slate-50 border-slate-200 min-h-[90px] w-full"
                  placeholder="Provide a detailed description of the health project..."
                  value={healthDesc}
                  onChange={(e) => setHealthDesc(e.target.value)}
                  disabled
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Total Target Participants *</Label>
                  <Input
                    className="h-11 w-full bg-slate-50 border-slate-200"
                    placeholder="Enter number of participants"
                    value={totalTarget}
                    onChange={(e) => setTotalTarget(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Target Participants *</Label>
                  <Input
                    className="h-11 w-full bg-slate-50 border-slate-200"
                    placeholder="e.g., Senior Citizens, Children, All Residents"
                    value={targetParticipants}
                    onChange={(e) => setTargetParticipants(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Budget Allocated (₱) *</Label>
                  <Input
                    className="h-11 w-full bg-slate-50 border-slate-200"
                    placeholder="Enter budget amount"
                    value={budgetAllocated}
                    onChange={(e) => setBudgetAllocated(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Implementing Office *</Label>
                  <Select value={implementingOffice} onValueChange={setImplementingOffice} disabled>
                    <SelectTrigger className="h-11 w-full bg-slate-50 border-slate-200">
                      <SelectValue placeholder="Select office" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Barangay Health Office">Barangay Health Office</SelectItem>
                      <SelectItem value="Barangay Council">Barangay Council</SelectItem>
                      <SelectItem value="Barangay Nutrition Office">Barangay Nutrition Office</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Status *</Label>
                <Select value={healthStatus} onValueChange={setHealthStatus}>
                  <SelectTrigger className="h-11 w-1/2 bg-slate-50 border-slate-200">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {HEALTH_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            /* INFRA FORM */
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date *</Label>
                  <Input
                    type="date"
                    className="h-11 w-full bg-slate-50 border-slate-200"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Target Completion Date *</Label>
                  <Input
                    type="date"
                    className="h-11 w-full bg-slate-50 border-slate-200"
                    value={targetCompletionDate}
                    onChange={(e) => setTargetCompletionDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Infrastructure Project Name *</Label>
                <Input
                  className="h-11 w-full bg-slate-50 border-slate-200"
                  placeholder="Enter project name"
                  value={infraName}
                  onChange={(e) => setInfraName(e.target.value)}
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label>Project Description *</Label>
                <Textarea
                  className="bg-slate-50 border-slate-200 min-h-[90px] w-full"
                  placeholder="Provide a detailed description of the infrastructure project..."
                  value={infraDesc}
                  onChange={(e) => setInfraDesc(e.target.value)}
                  disabled
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Implementing Office *</Label>
                  <Select value={infraOffice} onValueChange={setInfraOffice} disabled>
                    <SelectTrigger className="h-11 w-full bg-slate-50 border-slate-200">
                      <SelectValue placeholder="Select office" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Barangay Engineering Office">Barangay Engineering Office</SelectItem>
                      <SelectItem value="Barangay Council">Barangay Council</SelectItem>
                      <SelectItem value="City Engineering Office">City Engineering Office</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Funding Source *</Label>
                  <Select value={fundingSource} onValueChange={setFundingSource} disabled>
                    <SelectTrigger className="h-11 w-full bg-slate-50 border-slate-200">
                      <SelectValue placeholder="Select funding source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Local Government Fund">Local Government Fund</SelectItem>
                      <SelectItem value="Infrastructure Development Fund">Infrastructure Development Fund</SelectItem>
                      <SelectItem value="National Assistance">National Assistance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Contractor Name *</Label>
                <Input
                  className="h-11 w-full bg-slate-50 border-slate-200"
                  placeholder="Enter contractor name"
                  value={contractorName}
                  onChange={(e) => setContractorName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Contract Cost (₱) *</Label>
                  <Input
                    className="h-11 w-full bg-slate-50 border-slate-200"
                    placeholder="Enter contract cost"
                    value={contractCost}
                    onChange={(e) => setContractCost(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Status *</Label>
                  <Select value={infraStatus} onValueChange={setInfraStatus}>
                    <SelectTrigger className="h-11 w-full bg-slate-50 border-slate-200">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {INFRA_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Uploader Information */}
      <Card className="border-slate-200">
        <CardContent className="p-6">
          <div className="text-lg font-semibold text-slate-900">Uploader Information</div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <div className="text-slate-500">Name</div>
              <div className="mt-1 font-medium text-slate-900">{uploader.name}</div>
            </div>
            <div>
              <div className="text-slate-500">Position</div>
              <div className="mt-1 font-medium text-slate-900">{uploader.position}</div>
            </div>
            <div>
              <div className="text-slate-500">Office</div>
              <div className="mt-1 font-medium text-slate-900">{uploader.office}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button
          className="bg-[#022437] hover:bg-[#022437]/90"
          onClick={onDone}
          disabled={!requiredOk()}
        >
          Done
        </Button>
      </div>
    </div>
  );
}
