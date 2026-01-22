type AIPIdParameter = {
  params: Promise<{aipId: string}>
}

type ProjectIdParameter = {
  params: Promise<{projectId: string}>
}

type LGUAccount = {
  email: string,
  fullName: string,
  role: string,
  locale: string
};

type AuthParameters = {
  role: string,
  baseURL: string;
}

// Re-export all shared types from a single entry point

export type { NavItem, LguVariant } from "./navigation";

export type { AipStatus, AipRecord, AipUploader, AipDetail } from "./aip";

export type { ProjectStatus, HealthProject, InfrastructureProject } from "./projects";

