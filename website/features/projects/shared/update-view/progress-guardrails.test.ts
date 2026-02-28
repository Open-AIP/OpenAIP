import { describe, expect, it } from "vitest";
import {
  getCurrentProgressBaseline,
  isStrictlyIncreasingProgress,
} from "@/app/api/projects/_shared/progress-guardrails";

describe("progress-guardrails", () => {
  it("returns 0 baseline when no existing update progress exists", () => {
    expect(getCurrentProgressBaseline(null)).toBe(0);
    expect(getCurrentProgressBaseline([])).toBe(0);
  });

  it("returns baseline from existing max-progress row", () => {
    expect(getCurrentProgressBaseline([{ progress_percent: 60 }])).toBe(60);
  });

  it("enforces strict-forward progress scenarios", () => {
    const baseline = getCurrentProgressBaseline([{ progress_percent: 60 }]);

    expect(isStrictlyIncreasingProgress(60, baseline)).toBe(false);
    expect(isStrictlyIncreasingProgress(45, baseline)).toBe(false);
    expect(isStrictlyIncreasingProgress(61, baseline)).toBe(true);
  });
});
