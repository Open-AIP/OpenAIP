import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AipAccountabilityCard from "./components/aip-accountability-card";

describe("AipAccountabilityCard", () => {
  it("renders valid ISO dates using stable Manila date formatting", () => {
    render(
      <AipAccountabilityCard
        accountability={{
          uploadedBy: {
            id: "u1",
            name: "Uploader Name",
            role: "city_official",
            roleLabel: "City Official",
          },
          reviewedBy: null,
          approvedBy: {
            id: "u2",
            name: "Approver Name",
            role: "admin",
            roleLabel: "Admin",
          },
          uploadDate: "2026-02-25T08:17:25.136825+00:00",
          approvalDate: "2026-02-25T08:25:55.573482+00:00",
        }}
      />
    );

    expect(screen.getAllByText("February 25, 2026")).toHaveLength(2);
  });

  it("falls back to N/A for null or invalid dates", () => {
    render(
      <AipAccountabilityCard
        accountability={{
          uploadedBy: {
            id: "u1",
            name: "Uploader Name",
            role: "city_official",
            roleLabel: "City Official",
          },
          reviewedBy: null,
          approvedBy: {
            id: "u2",
            name: "Approver Name",
            role: "admin",
            roleLabel: "Admin",
          },
          uploadDate: "invalid-date",
          approvalDate: null,
        }}
      />
    );

    expect(screen.getAllByText("N/A")).toHaveLength(2);
  });
});
