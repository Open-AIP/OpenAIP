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

  it("shows clarification badge without grounded refusal text", () => {
    render(
      <ChatMessageBubble
        message={{
          id: "msg-clarification",
          role: "assistant",
          content: "Which one did you mean?",
          timeLabel: "10:01 AM",
          retrievalMeta: {
            refused: false,
            reason: "clarification_needed",
            status: "clarification",
          },
          citations: [
            {
              sourceId: "S0",
              scopeName: "System",
              scopeType: "system",
              snippet: "Clarification required",
            },
          ],
        }}
      />
    );

    expect(screen.getByText("Clarification needed.")).toBeInTheDocument();
    expect(screen.queryByText(/Grounded refusal/i)).not.toBeInTheDocument();
  });

  it("shows grounded refusal badge for refusal messages", () => {
    render(
      <ChatMessageBubble
        message={{
          id: "msg-refusal",
          role: "assistant",
          content: "I cannot answer right now.",
          timeLabel: "10:02 AM",
          retrievalMeta: {
            refused: true,
            reason: "insufficient_evidence",
          },
          citations: [
            {
              sourceId: "S0",
              scopeName: "System",
              scopeType: "system",
              snippet: "Insufficient evidence",
            },
          ],
        }}
      />
    );

    expect(screen.getByText(/Grounded refusal/i)).toBeInTheDocument();
  });
});
