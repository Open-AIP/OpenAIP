import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ChatMessageBubble from "./ChatMessageBubble";

describe("ChatMessageBubble", () => {
  it("shows DIST or MATCH labels and never shows SIM", () => {
    render(
      <ChatMessageBubble
        message={{
          id: "msg-1",
          role: "assistant",
          content: "Sample response",
          timeLabel: "10:00 AM",
          retrievalMeta: null,
          citations: [
            {
              sourceId: "L1",
              scopeName: "Barangay Mamatid - FY 2026 - Honoraria",
              scopeType: "barangay",
              fiscalYear: 2026,
              snippet: "Snippet A",
              distance: 0.23456,
            },
            {
              sourceId: "L2",
              scopeName: "Barangay Mamatid - FY 2026 - Road",
              scopeType: "barangay",
              fiscalYear: 2026,
              snippet: "Snippet B",
              matchScore: 0.75,
            },
          ],
        }}
      />
    );

    expect(screen.getByText("DIST 0.235")).toBeInTheDocument();
    expect(screen.getByText("MATCH 75.0%")).toBeInTheDocument();
    expect(screen.queryByText(/sim/i)).not.toBeInTheDocument();
  });
});
