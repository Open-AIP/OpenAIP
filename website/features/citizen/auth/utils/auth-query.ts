import type { CitizenAuthMode } from "@/features/citizen/auth/types";

type SearchParamsLike = {
  get(name: string): string | null;
  toString(): string;
};

export type CitizenAuthLaunchStep = "welcome" | "email";

export type ParsedCitizenAuthQuery = {
  mode: CitizenAuthMode | null;
  launchStep: CitizenAuthLaunchStep;
  next: string | null;
  forceCompleteProfile: boolean;
};

export const RETURN_TO_SESSION_KEY = "openAip:returnTo";

function hasProtocolPrefix(value: string): boolean {
  return /^[a-zA-Z][a-zA-Z0-9+\-.]*:/.test(value);
}

export function isSafeNextPath(value: string | null | undefined): value is string {
  if (!value) return false;
  if (!value.startsWith("/")) return false;
  if (value.startsWith("//")) return false;
  if (hasProtocolPrefix(value)) return false;
  return true;
}

function toSafeRelativePath(value: string | null | undefined): string | null {
  return isSafeNextPath(value) ? value : null;
}

export function parseCitizenAuthQuery(searchParams: SearchParamsLike): ParsedCitizenAuthQuery {
  const rawMode = searchParams.get("auth");
  const rawNext = searchParams.get("next");
  const rawReturnTo = searchParams.get("returnTo");
  const rawLaunchStep = searchParams.get("authStep");
  const rawForceComplete = searchParams.get("completeProfile");

  const mode: CitizenAuthMode | null =
    rawMode === "login" || rawMode === "signup" ? rawMode : null;
  const resolvedNext = toSafeRelativePath(rawNext) ?? toSafeRelativePath(rawReturnTo);

  return {
    mode,
    launchStep: rawLaunchStep === "email" ? "email" : "welcome",
    next: resolvedNext,
    forceCompleteProfile: rawForceComplete === "1",
  };
}

export function buildCitizenAuthHref(input: {
  pathname: string;
  searchParams?: SearchParamsLike;
  mode?: CitizenAuthMode | null;
  launchStep?: CitizenAuthLaunchStep;
  next?: string | null;
  completeProfile?: boolean;
}): string {
  const params = new URLSearchParams(input.searchParams?.toString() ?? "");

  if (input.mode) {
    params.set("auth", input.mode);
  } else {
    params.delete("auth");
  }

  if (input.launchStep === "email") {
    params.set("authStep", "email");
  } else {
    params.delete("authStep");
  }

  if (input.completeProfile) {
    params.set("completeProfile", "1");
  } else {
    params.delete("completeProfile");
  }

  const nextValue = toSafeRelativePath(input.next ?? null);
  if (nextValue) {
    params.set("next", nextValue);
    params.set("returnTo", nextValue);
  } else {
    params.delete("next");
    params.delete("returnTo");
  }

  const query = params.toString();
  return query ? `${input.pathname}?${query}` : input.pathname;
}

export function clearCitizenAuthQuery(pathname: string, searchParams: SearchParamsLike): string {
  const params = new URLSearchParams(searchParams.toString());
  params.delete("auth");
  params.delete("authStep");
  params.delete("next");
  params.delete("returnTo");
  params.delete("completeProfile");
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function setReturnToInSessionStorage(value: string | null | undefined): void {
  if (typeof window === "undefined") return;
  const safe = toSafeRelativePath(value);
  if (!safe) return;
  window.sessionStorage.setItem(RETURN_TO_SESSION_KEY, safe);
}

export function readReturnToFromSessionStorage(): string | null {
  if (typeof window === "undefined") return null;
  const value = window.sessionStorage.getItem(RETURN_TO_SESSION_KEY);
  return toSafeRelativePath(value);
}

export function clearReturnToFromSessionStorage(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(RETURN_TO_SESSION_KEY);
}
