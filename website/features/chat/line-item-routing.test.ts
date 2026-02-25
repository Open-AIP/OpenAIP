import { describe, expect, it } from "vitest";
import {
  buildLineItemAnswer,
  parseLineItemQuestion,
  rerankLineItemCandidates,
  shouldAskLineItemClarification,
  type LineItemRowRecord,
} from "@/lib/chat/line-item-routing";

describe("line-item routing helpers", () => {
  it("returns schedule information for schedule fact questions", () => {
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

    const answer = buildLineItemAnswer({ row, fields: parsed.factFields });
    expect(answer).toContain("total allocation: PHP 1,200.00");
    expect(answer).toContain("schedule: 2026-01-01 to 2026-12-31");
  });

  it("reranks candidates with fiscal-year and title token boosts", () => {
    const parsed = parseLineItemQuestion("Honoraria Administrative FY 2026 schedule");
    const ranked = rerankLineItemCandidates({
      question: parsed,
      requestedFiscalYear: 2026,
      candidates: [
        {
          line_item_id: "line-older",
          aip_id: "aip-older",
          fiscal_year: 2025,
          barangay_id: null,
          aip_ref_code: "1000-X",
          program_project_title: "Honoraria - Administrative",
          page_no: 1,
          row_no: 1,
          table_no: 0,
          similarity: 0.81,
        },
        {
          line_item_id: "line-best",
          aip_id: "aip-best",
          fiscal_year: 2026,
          barangay_id: null,
          aip_ref_code: "1000-A",
          program_project_title: "Honoraria - Administrative",
          page_no: 1,
          row_no: 2,
          table_no: 0,
          similarity: 0.8,
        },
      ],
    });

    expect(ranked[0].line_item_id).toBe("line-best");
  });

  it("global line-item answer does not include account scope assumption text", () => {
    const row: LineItemRowRecord = {
      id: "line-global",
      aip_id: "aip-global",
      fiscal_year: 2026,
      barangay_id: null,
      aip_ref_code: "2000-A",
      program_project_title: "Road Concreting",
      implementing_agency: "Engineering Office",
      start_date: "2026-02-01",
      end_date: "2026-10-31",
      fund_source: "20% Development Fund",
      ps: null,
      mooe: null,
      co: 500000,
      fe: null,
      total: 500000,
      expected_output: "Concrete road",
      page_no: 2,
      row_no: 10,
      table_no: 1,
    };

    const answer = buildLineItemAnswer({
      row,
      fields: ["fund_source"],
    });

    expect(answer).toContain("fund source: 20% Development Fund");
    expect(answer).not.toContain("based on your account scope");
  });

  it("detects ambiguous top candidates for clarification", () => {
    const parsed = parseLineItemQuestion("road concreting schedule");
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
          program_project_title: "Road Concreting Phase 1",
          page_no: 3,
          row_no: 4,
          table_no: 1,
          similarity: 0.78,
        },
        {
          line_item_id: "line-2",
          aip_id: "aip-2",
          fiscal_year: 2026,
          barangay_id: "brgy-1",
          aip_ref_code: "3000-B",
          program_project_title: "Road Concreting Phase 2",
          page_no: 3,
          row_no: 5,
          table_no: 1,
          similarity: 0.775,
        },
      ],
    });

    expect(shouldAskLineItemClarification(ranked)).toBe(true);
  });
});
