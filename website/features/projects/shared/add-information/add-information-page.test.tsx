import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AddInformationPage from "./add-information-page";

const routerRefresh = vi.fn();
const routerBack = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: routerRefresh,
    back: routerBack,
  }),
}));

vi.mock("@/components/layout/breadcrumb-nav", () => ({
  BreadcrumbNav: () => null,
}));

vi.mock("./FormField", () => ({
  FormField: ({
    config,
    register,
    value,
    onChange,
  }: {
    config: {
      name: string;
      type: "text" | "textarea" | "select" | "date";
      disabled?: boolean;
      readOnly?: boolean;
      options?: readonly string[] | string[];
    };
    register: (name: string) => {
      name: string;
      onBlur: () => void;
      onChange: (event: unknown) => void;
      ref: (instance: unknown) => void;
    };
    value?: string;
    onChange?: (nextValue: string) => void;
  }) => {
    const registration = register(config.name);

    if (config.type === "textarea") {
      return (
        <textarea
          data-testid={`field-${config.name}`}
          {...registration}
          disabled={config.disabled}
          readOnly={config.readOnly}
        />
      );
    }

    if (config.type === "select") {
      return (
        <select
          data-testid={`field-${config.name}`}
          value={value ?? ""}
          onChange={(event) => onChange?.(event.target.value)}
          disabled={config.disabled}
        >
          <option value="">Select</option>
          {(config.options ?? []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }

    return (
      <input
        data-testid={`field-${config.name}`}
        type={config.type === "date" ? "date" : "text"}
        {...registration}
        disabled={config.disabled}
        readOnly={config.readOnly}
      />
    );
  },
}));

function getPostedFormData(fetchMock: ReturnType<typeof vi.fn>): FormData {
  const init = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined;
  if (!init || !(init.body instanceof FormData)) {
    throw new Error("Expected first fetch call body to be FormData.");
  }
  return init.body;
}

describe("AddInformationPage date handling", () => {
  beforeEach(() => {
    routerRefresh.mockReset();
    routerBack.mockReset();
    vi.restoreAllMocks();
  });

  it("renders infrastructure prefilled dates as exact normalized values and locks them", () => {
    render(
      <AddInformationPage
        projectId="PROJ-I-TEST"
        scope="barangay"
        kind="infrastructure"
        breadcrumb={[{ label: "Infrastructure" }]}
        uploader={{ name: "Uploader", position: "Official", office: "Office" }}
        projectInfo={{
          name: "Road Project",
          description: "Road repair",
          startDate: "2026-01-01T00:30:00+14:00",
          targetCompletionDate: "2026-05-30T23:59:59+14:00",
          implementingOffice: "Engineering Office",
          fundingSource: "Local Fund",
        }}
      />
    );

    const startDateInput = screen.getByTestId("field-startDate") as HTMLInputElement;
    const completionInput = screen.getByTestId(
      "field-targetCompletionDate"
    ) as HTMLInputElement;

    expect(startDateInput.value).toBe("2026-01-01");
    expect(completionInput.value).toBe("2026-05-30");
    expect(startDateInput.disabled).toBe(true);
    expect(completionInput.disabled).toBe(true);
  });

  it("submits infrastructure start/completion dates even when disabled via prefill backfill", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue({ ok: true, json: async () => ({}) } as Response);

    const { container } = render(
      <AddInformationPage
        projectId="PROJ-I-TEST"
        scope="barangay"
        kind="infrastructure"
        breadcrumb={[{ label: "Infrastructure" }]}
        uploader={{ name: "Uploader", position: "Official", office: "Office" }}
        projectInfo={{
          name: "Road Project",
          description: "Road repair",
          startDate: "2026-01-01T00:30:00+14:00",
          targetCompletionDate: "2026-05-30T23:59:59+14:00",
          implementingOffice: "Engineering Office",
          fundingSource: "Local Fund",
        }}
      />
    );

    fireEvent.change(screen.getByTestId("field-contractorName"), {
      target: { value: "ABC Builders" },
    });
    fireEvent.change(screen.getByTestId("field-contractCost"), {
      target: { value: "1,500,000" },
    });
    fireEvent.change(screen.getByTestId("field-status"), {
      target: { value: "ongoing" },
    });

    const form = container.querySelector("form");
    if (!form) {
      throw new Error("Expected form element.");
    }
    fireEvent.submit(form);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    const posted = getPostedFormData(fetchMock);
    expect(posted.get("startDate")).toBe("2026-01-01");
    expect(posted.get("targetCompletionDate")).toBe("2026-05-30");
  });

  it("submits health prefilled dates as normalized values", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue({ ok: true, json: async () => ({}) } as Response);

    const { container } = render(
      <AddInformationPage
        projectId="PROJ-H-TEST"
        scope="barangay"
        kind="health"
        breadcrumb={[{ label: "Health" }]}
        uploader={{ name: "Uploader", position: "Official", office: "Office" }}
        projectInfo={{
          name: "Health Project",
          description: "Community health initiative",
          startDate: "2026-03-10T00:30:00+14:00",
          targetCompletionDate: "2026-10-01T22:30:00+14:00",
          budgetAllocated: "250000",
          implementingOffice: "Barangay Health Office",
        }}
      />
    );

    fireEvent.change(screen.getByTestId("field-totalTargetParticipants"), {
      target: { value: "500" },
    });
    fireEvent.change(screen.getByTestId("field-targetParticipants"), {
      target: { value: "Residents" },
    });
    fireEvent.change(screen.getByTestId("field-status"), {
      target: { value: "ongoing" },
    });

    const form = container.querySelector("form");
    if (!form) {
      throw new Error("Expected form element.");
    }
    fireEvent.submit(form);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    const posted = getPostedFormData(fetchMock);
    expect(posted.get("startDate")).toBe("2026-03-10");
    expect(posted.get("targetCompletionDate")).toBe("2026-10-01");
  });
});

