import { describe, expect, it } from "vitest";
import { detectExplicitBarangayMention, resolveTotalsScope } from "@/lib/chat/scope";

describe("detectExplicitBarangayMention", () => {
  it("detects parenthesized barangay mention", () => {
    const detected = detectExplicitBarangayMention(
      "What is the Total Investment Program for FY 2026 (Barangay Mamatid)?"
    );
    expect(detected).toBe("Mamatid");
  });

  it("detects plain Barangay mention without in/for", () => {
    const detected = detectExplicitBarangayMention(
      "What is the Total Investment Program for FY 2026 Barangay Mamatid?"
    );
    expect(detected).toBe("Mamatid");
  });

  it("detects Brgy abbreviation mention", () => {
    const detected = detectExplicitBarangayMention(
      "What is the Total Investment Program for FY 2026 Brgy. Mamatid?"
    );
    expect(detected).toBe("Mamatid");
  });
});

describe("resolveTotalsScope", () => {
  it("defaults to user barangay when message has no explicit barangay", () => {
    const resolved = resolveTotalsScope("What is the Total Investment Program for FY 2026?", {
      id: "brgy-1",
      name: "Mamatid",
    });

    expect(resolved).toEqual({
      barangayId: "brgy-1",
      barangayName: "Mamatid",
      scopeReason: "default_user_barangay",
    });
  });

  it("detects explicit own-barangay cues", () => {
    const resolved = resolveTotalsScope("What is the Total Investment Program in our barangay for FY 2026?", {
      id: "brgy-1",
      name: "Mamatid",
    });

    expect(resolved).toEqual({
      barangayId: "brgy-1",
      barangayName: "Mamatid",
      scopeReason: "explicit_our_barangay",
    });
  });

  it("uses explicit barangay when provided", () => {
    const resolved = resolveTotalsScope(
      "What is the Total Investment Program for FY 2026 (Barangay Mamatid)?",
      {
        id: "brgy-1",
        name: "Mamatid",
      },
      {
        id: "brgy-2",
        name: "Poblacion",
      }
    );

    expect(resolved).toEqual({
      barangayId: "brgy-2",
      barangayName: "Poblacion",
      scopeReason: "explicit_barangay",
    });
  });

  it("returns unknown when neither explicit nor user scope exists", () => {
    const resolved = resolveTotalsScope("What is the Total Investment Program for FY 2026?", null);

    expect(resolved).toEqual({
      barangayId: null,
      barangayName: null,
      scopeReason: "unknown",
    });
  });
});
