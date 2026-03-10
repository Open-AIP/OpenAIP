import fs from "node:fs";
import { getScenarioPathForProject } from "./env";

export type OfficialRole = "barangay_official" | "city_official" | "municipal_official";

export type LguType = "region" | "province" | "city" | "municipality" | "barangay";

export type E2EScenario = {
  aipWorkflow: {
    uploadFiscalYear: number;
    submissionAipId: string;
    publishedAipId: string;
    revisionComment: string;
    resubmissionReply: string;
  };
  citizen: {
    feedbackMessage: string;
  };
  admin: {
    usageControls: {
      chatbotMaxRequests: number;
      chatbotTimeWindow: "per_hour" | "per_day";
    };
    createLguAccount: {
      fullName: string;
      email: string;
      role: OfficialRole;
      lguKey: string;
    };
    addLgu: {
      type: LguType;
      name: string;
      code: string;
      regionId?: string;
      provinceId?: string;
      parentType?: "city" | "municipality";
      parentId?: string;
    };
  };
};

function assertString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Invalid scenario value for ${label}. Expected non-empty string.`);
  }
  return value.trim();
}

function assertNumber(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Invalid scenario value for ${label}. Expected number.`);
  }
  return value;
}

function optionalString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parseScenario(raw: unknown): E2EScenario {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("Scenario must be a JSON object.");
  }

  const input = raw as Record<string, unknown>;
  const aipWorkflow = input.aipWorkflow as Record<string, unknown> | undefined;
  const citizen = input.citizen as Record<string, unknown> | undefined;
  const admin = input.admin as Record<string, unknown> | undefined;

  if (!aipWorkflow || !citizen || !admin) {
    throw new Error("Scenario must contain aipWorkflow, citizen, and admin objects.");
  }

  const usageControls = admin.usageControls as Record<string, unknown> | undefined;
  const createLguAccount = admin.createLguAccount as Record<string, unknown> | undefined;
  const addLgu = admin.addLgu as Record<string, unknown> | undefined;

  if (!usageControls || !createLguAccount || !addLgu) {
    throw new Error("Scenario.admin must contain usageControls, createLguAccount, and addLgu.");
  }

  return {
    aipWorkflow: {
      uploadFiscalYear: assertNumber(aipWorkflow.uploadFiscalYear, "aipWorkflow.uploadFiscalYear"),
      submissionAipId: assertString(aipWorkflow.submissionAipId, "aipWorkflow.submissionAipId"),
      publishedAipId: assertString(aipWorkflow.publishedAipId, "aipWorkflow.publishedAipId"),
      revisionComment: assertString(aipWorkflow.revisionComment, "aipWorkflow.revisionComment"),
      resubmissionReply: assertString(aipWorkflow.resubmissionReply, "aipWorkflow.resubmissionReply"),
    },
    citizen: {
      feedbackMessage: assertString(citizen.feedbackMessage, "citizen.feedbackMessage"),
    },
    admin: {
      usageControls: {
        chatbotMaxRequests: assertNumber(
          usageControls.chatbotMaxRequests,
          "admin.usageControls.chatbotMaxRequests"
        ),
        chatbotTimeWindow:
          usageControls.chatbotTimeWindow === "per_hour" ||
          usageControls.chatbotTimeWindow === "per_day"
            ? usageControls.chatbotTimeWindow
            : (() => {
                throw new Error(
                  "Invalid scenario value for admin.usageControls.chatbotTimeWindow. Expected per_hour or per_day."
                );
              })(),
      },
      createLguAccount: {
        fullName: assertString(createLguAccount.fullName, "admin.createLguAccount.fullName"),
        email: assertString(createLguAccount.email, "admin.createLguAccount.email"),
        role:
          createLguAccount.role === "barangay_official" ||
          createLguAccount.role === "city_official" ||
          createLguAccount.role === "municipal_official"
            ? createLguAccount.role
            : (() => {
                throw new Error(
                  "Invalid scenario value for admin.createLguAccount.role."
                );
              })(),
        lguKey: assertString(createLguAccount.lguKey, "admin.createLguAccount.lguKey"),
      },
      addLgu: {
        type:
          addLgu.type === "region" ||
          addLgu.type === "province" ||
          addLgu.type === "city" ||
          addLgu.type === "municipality" ||
          addLgu.type === "barangay"
            ? addLgu.type
            : (() => {
                throw new Error("Invalid scenario value for admin.addLgu.type.");
              })(),
        name: assertString(addLgu.name, "admin.addLgu.name"),
        code: assertString(addLgu.code, "admin.addLgu.code"),
        regionId: optionalString(addLgu.regionId),
        provinceId: optionalString(addLgu.provinceId),
        parentType:
          addLgu.parentType === "city" || addLgu.parentType === "municipality"
            ? addLgu.parentType
            : undefined,
        parentId: optionalString(addLgu.parentId),
      },
    },
  };
}

export function loadScenarioForProject(projectName: string): E2EScenario {
  const scenarioPath = getScenarioPathForProject(projectName);
  if (!fs.existsSync(scenarioPath)) {
    throw new Error(`Scenario file does not exist: ${scenarioPath}`);
  }
  const raw = fs.readFileSync(scenarioPath, "utf8");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(
      `Failed to parse scenario JSON at ${scenarioPath}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
  return parseScenario(parsed);
}
