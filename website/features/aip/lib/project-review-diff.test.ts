import { describe, expect, it } from "vitest";
import {
  diffProjectEditableFields,
  projectEditableFieldsFromRow,
} from "@/lib/repos/aip/project-review";
import type { AipProjectRow } from "@/lib/repos/aip/repo";

const BASE_ROW: AipProjectRow = {
  id: "project-001",
  aipId: "aip-001",
  aipRefCode: "9000-003-002-001",
  programProjectDescription: "Sample Project",
  implementingAgency: "Office of Punong Barangay",
  startDate: "2026-01-01",
  completionDate: "2026-12-31",
  expectedOutput: "Output",
  sourceOfFunds: "GF (SA) 10% SK Fund",
  personalServices: 1000,
  maintenanceAndOtherOperatingExpenses: 2000,
  financialExpenses: null,
  capitalOutlay: 3000,
  total: 6000,
  climateChangeAdaptation: null,
  climateChangeMitigation: null,
  ccTopologyCode: null,
  prmNcrLguRmObjectiveResultsIndicator: null,
  category: "other",
  errors: null,
  projectRefCode: "9000-003-002-001",
  kind: "other",
  sector: "Other Services",
  amount: 6000,
  reviewStatus: "unreviewed",
  aipDescription: "Sample Project",
  aiIssues: undefined,
  officialComment: undefined,
};

describe("project review diff normalization", () => {
  it("ignores whitespace-only variants in text fields", () => {
    const before = projectEditableFieldsFromRow(BASE_ROW);
    const after = {
      ...before,
      implementingAgency: "Office\u00A0of\u202FPunong   Barangay",
      sourceOfFunds: "GF   (SA) 10% SK Fund",
    };

    const diff = diffProjectEditableFields(before, after);
    expect(diff).toHaveLength(0);
  });

  it("ignores hyphen spacing differences for aip reference code", () => {
    const before = projectEditableFieldsFromRow(BASE_ROW);
    const after = {
      ...before,
      aipRefCode: "9000 - 003 - 002 - 001",
    };

    const diff = diffProjectEditableFields(before, after);
    expect(diff).toHaveLength(0);
  });

  it("still detects actual value changes", () => {
    const before = projectEditableFieldsFromRow(BASE_ROW);
    const after = {
      ...before,
      sourceOfFunds: "GF (SA) 20% SK Fund",
    };

    const diff = diffProjectEditableFields(before, after);
    expect(diff).toHaveLength(1);
    expect(diff[0]?.key).toBe("sourceOfFunds");
  });
});
