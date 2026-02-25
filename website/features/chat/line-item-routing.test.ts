import { describe, expect, it } from "vitest";
import {
  buildLineItemAnswer,
  buildLineItemScopeDisclosure,
  parseLineItemQuestion,
  rerankLineItemCandidates,
  resolveLineItemScopeDecision,
  shouldAskLineItemClarification,
  type LineItemRowRecord,
} from "@/lib/chat/line-item-routing";

describe("line-item routing helpers", () => {
  it("defaults to user barangay scope and includes account-scope disclosure", () => {
    const parsed = parseLineItemQuestion(
      "How much is allocated for Honoraria - Administrative in FY 2026 and what's the schedule?"
    );
    const scope = resolveLineItemScopeDecision({
      question: parsed,
      scopeResolution: {
        mode: "global",
        resolvedTargets: [],
      },
      userBarangayId: "brgy-1",
    });

    expect(scope.scopeReason).toBe("default_user_barangay");
    expect(scope.barangayIdUsed).toBe("brgy-1");

    const disclosure = buildLineItemScopeDisclosure({
      scopeReason: scope.scopeReason,
      barangayName: "Mamatid",
    });
    expect(disclosure).toContain("based on your account scope");
  });

  it("explicit barangay scope does not include account-scope disclosure", () => {
    const parsed = parseLineItemQuestion(
      "In FY 2026, what is the fund source for Road Concreting in Barangay Mamatid?"
    );
    const scope = resolveLineItemScopeDecision({
      question: parsed,
      scopeResolution: {
        mode: "named_scopes",
        resolvedTargets: [
          {
            scopeType: "barangay",
            scopeId: "brgy-1",
            scopeName: "Mamatid",
          },
        ],
      },
      userBarangayId: "brgy-1",
    });

    expect(scope.scopeReason).toBe("explicit_barangay");
    const disclosure = buildLineItemScopeDisclosure({
      scopeReason: scope.scopeReason,
      barangayName: "Mamatid",
    });
    expect(disclosure).toBeNull();
  });

  it("returns schedule from structured row fields", () => {
    const parsed = parseLineItemQuestion(
      "How much is allocated for Honoraria - Administrative in FY 2026 and what's the schedule?"
    );
    const row: LineItemRowRecord = {
      id: "line-1",
      aip_id: "aip-1",
      fiscal_year: 2026,
      barangay_id: "brgy-1",
      aip_ref_code: "1000-A",
      program_project_title: "Honoraria - Administrative",
      implementing_agency: "Barangay Council",
      start_date: "2026-01-01",
      end_date: "2026-12-31",
      fund_source: "General Fund",
      ps: 1000,
      mooe: 200,
      co: 0,
      fe: 0,
      total: 1200,
      expected_output: "Monthly release",
      page_no: 1,
      row_no: 3,
      table_no: 0,
    };

    const answer = buildLineItemAnswer({
      row,
      fields: parsed.factFields,
      scopeDisclosure: "(Barangay Mamatid - based on your account scope)",
    });
    expect(answer).toContain("total allocation: PHP 1,200.00");
    expect(answer).toContain("schedule: 2026-01-01 to 2026-12-31");
    expect(answer).toContain("based on your account scope");
  });

  it("asks clarification when top candidates are close and titles differ", () => {
    const parsed = parseLineItemQuestion("How much is the honoraria in FY 2026?");
    const ranked = rerankLineItemCandidates({
      question: parsed,
      requestedFiscalYear: 2026,
      candidates: [
        {
          line_item_id: "line-1",
          aip_id: "aip-1",
          fiscal_year: 2026,
          barangay_id: "brgy-1",
          aip_ref_code: "3000-A",
          program_project_title: "Honoraria - Administrative",
          page_no: 3,
          row_no: 4,
          table_no: 1,
          distance: 0.200,
          score: 0.8333,
        },
        {
          line_item_id: "line-2",
          aip_id: "aip-2",
          fiscal_year: 2026,
          barangay_id: "brgy-1",
          aip_ref_code: "3000-B",
          program_project_title: "Honoraria - Infrastructure",
          page_no: 3,
          row_no: 5,
          table_no: 1,
          distance: 0.230,
          score: 0.8130,
        },
      ],
    });

    expect(
      shouldAskLineItemClarification({
        question: parsed,
        candidates: ranked,
      })
    ).toBe(true);
  });

  it("does not ask clarification when ref code disambiguates", () => {
    const parsed = parseLineItemQuestion("How much is the honoraria for ref 3000-a in FY 2026?");
    const ranked = rerankLineItemCandidates({
      question: parsed,
      requestedFiscalYear: 2026,
      candidates: [
        {
          line_item_id: "line-1",
          aip_id: "aip-1",
          fiscal_year: 2026,
          barangay_id: "brgy-1",
          aip_ref_code: "3000-A",
          program_project_title: "Honoraria - Administrative",
          page_no: 3,
          row_no: 4,
          table_no: 1,
          distance: 0.200,
          score: 0.8333,
        },
        {
          line_item_id: "line-2",
          aip_id: "aip-2",
          fiscal_year: 2026,
          barangay_id: "brgy-1",
          aip_ref_code: "3000-B",
          program_project_title: "Honoraria - Infrastructure",
          page_no: 3,
          row_no: 5,
          table_no: 1,
          distance: 0.230,
          score: 0.8130,
        },
      ],
    });

    expect(
      shouldAskLineItemClarification({
        question: parsed,
        candidates: ranked,
      })
    ).toBe(false);
  });

  it("does not ask clarification when exact title phrase disambiguates", () => {
    const parsed = parseLineItemQuestion(
      "How much is allocated for Honoraria - Administrative in FY 2026?"
    );
    const ranked = rerankLineItemCandidates({
      question: parsed,
      requestedFiscalYear: 2026,
      candidates: [
        {
          line_item_id: "line-1",
          aip_id: "aip-1",
          fiscal_year: 2026,
          barangay_id: "brgy-1",
          aip_ref_code: "3000-A",
          program_project_title: "Honoraria - Administrative",
          page_no: 3,
          row_no: 4,
          table_no: 1,
          distance: 0.200,
          score: 0.8333,
        },
        {
          line_item_id: "line-2",
          aip_id: "aip-2",
          fiscal_year: 2026,
          barangay_id: "brgy-1",
          aip_ref_code: "3000-B",
          program_project_title: "Honoraria - Infrastructure",
          page_no: 3,
          row_no: 5,
          table_no: 1,
          distance: 0.230,
          score: 0.8130,
        },
      ],
    });

    expect(
      shouldAskLineItemClarification({
        question: parsed,
        candidates: ranked,
      })
    ).toBe(false);
  });
});
