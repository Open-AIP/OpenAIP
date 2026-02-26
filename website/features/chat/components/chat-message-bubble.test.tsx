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
            {
              sourceId: "L3",
              scopeName: "Barangay Mamatid - FY 2026 - Legacy",
              scopeType: "barangay",
              fiscalYear: 2026,
              snippet: "Snippet C",
              similarity: 0.64,
            },
          ],
        }}
      />
    );

    expect(screen.getByText("DIST 0.235")).toBeInTheDocument();
    expect(screen.getByText("MATCH 75%")).toBeInTheDocument();
    expect(screen.getByText("MATCH 64%")).toBeInTheDocument();
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

  it("renders retrieval suggestions when provided", () => {
    render(
      <ChatMessageBubble
        message={{
          id: "msg-suggestions",
          role: "assistant",
          content: "I couldn't find a matching entry.",
          timeLabel: "10:03 AM",
          retrievalMeta: {
            refused: true,
            reason: "insufficient_evidence",
            status: "refusal",
            suggestions: [
              "Try the exact project title as written in the AIP.",
              "Provide the Ref code (e.g., 8000-003-002-006).",
              "Remove extra filters (scope/year) to broaden search.",
            ],
          },
          citations: [],
        }}
      />
    );

    expect(screen.getByText("Try:")).toBeInTheDocument();
    expect(
      screen.getByText((content) =>
        content.includes("1. Try the exact project title as written in the AIP.")
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText((content) =>
        content.includes("2. Provide the Ref code (e.g., 8000-003-002-006).")
      )
    ).toBeInTheDocument();
  });
});
