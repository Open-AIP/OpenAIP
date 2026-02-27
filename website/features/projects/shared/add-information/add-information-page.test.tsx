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

function getDoneButton(): HTMLButtonElement {
  return screen.getByRole("button", { name: "Done" }) as HTMLButtonElement;
}

function createHealthProjectInfo() {
  return {
    name: "Health Project",
    description: "Community health initiative",
    startDate: "2026-03-10T00:30:00+14:00",
    targetCompletionDate: "2026-10-01T22:30:00+14:00",
    budgetAllocated: "250000",
    implementingOffice: "Barangay Health Office",
    totalTargetParticipants: "500",
    targetParticipants: "Residents",
    status: "ongoing" as const,
  };
}

function createInfrastructureProjectInfo() {
  return {
    name: "Road Project",
    description: "Road repair",
    startDate: "2026-01-01T00:30:00+14:00",
    targetCompletionDate: "2026-05-30T23:59:59+14:00",
    implementingOffice: "Engineering Office",
    fundingSource: "Local Fund",
    contractorName: "ABC Builders",
    contractCost: "1,500,000",
    status: "ongoing" as const,
  };
}

describe("AddInformationPage submit gating", () => {
  beforeEach(() => {
    routerRefresh.mockReset();
    routerBack.mockReset();
    vi.restoreAllMocks();
  });

  it("keeps Done disabled when values are unchanged and blocks no-change submit", async () => {
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
        projectInfo={createHealthProjectInfo()}
      />
    );

    const doneButton = getDoneButton();
    await waitFor(() => {
      expect(doneButton).toBeDisabled();
    });

    const form = container.querySelector("form");
    if (!form) {
      throw new Error("Expected form element.");
    }
    fireEvent.submit(form);

    await waitFor(() => {
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  it("enables Done only when values change and disables again when reverted", async () => {
    render(
      <AddInformationPage
        projectId="PROJ-H-TEST"
        scope="barangay"
        kind="health"
        breadcrumb={[{ label: "Health" }]}
        uploader={{ name: "Uploader", position: "Official", office: "Office" }}
        projectInfo={createHealthProjectInfo()}
      />
    );

    const doneButton = getDoneButton();
    const statusSelect = screen.getByTestId("field-status") as HTMLSelectElement;

    await waitFor(() => {
      expect(doneButton).toBeDisabled();
    });

    fireEvent.change(statusSelect, { target: { value: "completed" } });
    await waitFor(() => {
      expect(doneButton).toBeEnabled();
    });

    fireEvent.change(statusSelect, { target: { value: "ongoing" } });
    await waitFor(() => {
      expect(doneButton).toBeDisabled();
    });
  });

  it("treats photo upload as a change and enables Done", async () => {
    const { container } = render(
      <AddInformationPage
        projectId="PROJ-I-TEST"
        scope="barangay"
        kind="infrastructure"
        breadcrumb={[{ label: "Infrastructure" }]}
        uploader={{ name: "Uploader", position: "Official", office: "Office" }}
        projectInfo={createInfrastructureProjectInfo()}
      />
    );

    const doneButton = getDoneButton();
    await waitFor(() => {
      expect(doneButton).toBeDisabled();
    });

    const fileInput = container.querySelector('input[type="file"]');
    if (!(fileInput instanceof HTMLInputElement)) {
      throw new Error("Expected file input element.");
    }
    const photo = new File(["binary"], "cover.png", { type: "image/png" });
    fireEvent.change(fileInput, { target: { files: [photo] } });

    await waitFor(() => {
      expect(doneButton).toBeEnabled();
    });
  });

  it("renders infrastructure prefilled values, with exact normalized dates and locked date inputs", () => {
    render(
      <AddInformationPage
        projectId="PROJ-I-TEST"
        scope="barangay"
        kind="infrastructure"
        breadcrumb={[{ label: "Infrastructure" }]}
        uploader={{ name: "Uploader", position: "Official", office: "Office" }}
        projectInfo={createInfrastructureProjectInfo()}
      />
    );

    const startDateInput = screen.getByTestId("field-startDate") as HTMLInputElement;
    const completionInput = screen.getByTestId(
      "field-targetCompletionDate"
    ) as HTMLInputElement;
    const contractorNameInput = screen.getByTestId(
      "field-contractorName"
    ) as HTMLInputElement;
    const contractCostInput = screen.getByTestId("field-contractCost") as HTMLInputElement;
    const statusSelect = screen.getByTestId("field-status") as HTMLSelectElement;

    expect(startDateInput.value).toBe("2026-01-01");
    expect(completionInput.value).toBe("2026-05-30");
    expect(startDateInput.disabled).toBe(true);
    expect(completionInput.disabled).toBe(true);
    expect(contractorNameInput.value).toBe("ABC Builders");
    expect(contractCostInput.value).toBe("1,500,000");
    expect(statusSelect.value).toBe("ongoing");
  });

  it("submits infrastructure changed values including disabled-date backfill", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue({ ok: true, json: async () => ({}) } as Response);

    render(
      <AddInformationPage
        projectId="PROJ-I-TEST"
        scope="barangay"
        kind="infrastructure"
        breadcrumb={[{ label: "Infrastructure" }]}
        uploader={{ name: "Uploader", position: "Official", office: "Office" }}
        projectInfo={createInfrastructureProjectInfo()}
      />
    );
    fireEvent.change(screen.getByTestId("field-status"), {
      target: { value: "completed" },
    });
    const doneButton = getDoneButton();
    await waitFor(() => {
      expect(doneButton).toBeEnabled();
    });

    fireEvent.click(doneButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    const posted = getPostedFormData(fetchMock);
    expect(posted.get("startDate")).toBe("2026-01-01");
    expect(posted.get("targetCompletionDate")).toBe("2026-05-30");
    expect(posted.get("contractorName")).toBe("ABC Builders");
    expect(posted.get("contractCost")).toBe("1,500,000");
    expect(posted.get("status")).toBe("completed");
  });

  it("submits health changed values with normalized-date and required-field backfill", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue({ ok: true, json: async () => ({}) } as Response);

    render(
      <AddInformationPage
        projectId="PROJ-H-TEST"
        scope="barangay"
        kind="health"
        breadcrumb={[{ label: "Health" }]}
        uploader={{ name: "Uploader", position: "Official", office: "Office" }}
        projectInfo={createHealthProjectInfo()}
      />
    );
    fireEvent.change(screen.getByTestId("field-status"), {
      target: { value: "completed" },
    });
    const totalTargetInput = screen.getByTestId("field-totalTargetParticipants") as HTMLInputElement;
    const targetParticipantsInput = screen.getByTestId(
      "field-targetParticipants"
    ) as HTMLInputElement;
    const statusSelect = screen.getByTestId("field-status") as HTMLSelectElement;

    expect(totalTargetInput.value).toBe("500");
    expect(targetParticipantsInput.value).toBe("Residents");
    expect(statusSelect.value).toBe("completed");

    const doneButton = getDoneButton();
    await waitFor(() => {
      expect(doneButton).toBeEnabled();
    });
    fireEvent.click(doneButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    const posted = getPostedFormData(fetchMock);
    expect(posted.get("startDate")).toBe("2026-03-10");
    expect(posted.get("targetCompletionDate")).toBe("2026-10-01");
    expect(posted.get("totalTargetParticipants")).toBe("500");
    expect(posted.get("targetParticipants")).toBe("Residents");
    expect(posted.get("status")).toBe("completed");
  });
});
