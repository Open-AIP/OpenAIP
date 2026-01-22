export type AIPIdParameter = {
  params: Promise<{aipId: string}>
}

export type ProjectIdParameter = {
  params: Promise<{projectId: string}>
}

export type LGUAccount = {
  email: string,
  fullName: string,
  role: string,
  locale: string
};

export type AuthParameters = {
  role: string,
  baseURL: string;
}

// Re-export all shared types from a single entry point

export type { NavItem, LguVariant } from "./navigation";

export type { AipStatus, AipRecord, AipUploader, AipDetail } from "./aip";

export type { ProjectStatus, HealthProject, HealthProjectUpdate, InfrastructureProject, InfrastructureProjectUpdate } from "./projects";

export type { ProjectUpdate, ProjectHeaderModel } from "./project-updates";
