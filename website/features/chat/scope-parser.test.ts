import { describe, expect, it } from "vitest";
import { parseScopeCue } from "@/lib/chat/scope-parser";

describe("parseScopeCue", () => {
  it("detects own barangay cue", () => {
    const parsed = parseScopeCue("What are our priorities in our barangay this year?");
    expect(parsed.hasOwnBarangayCue).toBe(true);
    expect(parsed.requestedScopes).toHaveLength(0);
  });

  it("detects multiple named barangays", () => {
    const parsed = parseScopeCue("Compare programs in barangay San Isidro and barangay Maligaya.");
    expect(parsed.hasOwnBarangayCue).toBe(false);
    expect(parsed.requestedScopes).toEqual([
      { scopeType: "barangay", scopeName: "San Isidro" },
      { scopeType: "barangay", scopeName: "Maligaya" },
    ]);
  });

  it("detects city and municipality cues in Filipino", () => {
    const parsed = parseScopeCue(
      "Ihambing ang pondo sa lungsod ng Naga at sa bayan ng Pili."
    );
    expect(parsed.requestedScopes).toEqual([
      { scopeType: "city", scopeName: "Naga" },
      { scopeType: "municipality", scopeName: "Pili" },
    ]);
  });
});
