import type { CitizenAuthMode } from "@/features/citizen/auth/types";

type SearchParamsLike = {
  get(name: string): string | null;
  toString(): string;
};

export type ParsedCitizenAuthQuery = {
  mode: CitizenAuthMode | null;
  next: string | null;
};

function isSafeNextPath(value: string | null | undefined): value is string {
  return !!value && value.startsWith("/") && !value.startsWith("//");
}

export function parseCitizenAuthQuery(
  searchParams: SearchParamsLike
): ParsedCitizenAuthQuery {
  const rawMode = searchParams.get("auth");
  const rawNext = searchParams.get("next");
  const rawReturnTo = searchParams.get("returnTo");

  const mode: CitizenAuthMode | null =
    rawMode === "login" || rawMode === "signup" ? rawMode : null;
  const resolvedNext = isSafeNextPath(rawNext)
    ? rawNext
    : isSafeNextPath(rawReturnTo)
      ? rawReturnTo
      : null;

  return {
    mode,
    next: resolvedNext,
  };
}

export function buildCitizenAuthHref(input: {
  pathname: string;
  searchParams?: SearchParamsLike;
  mode: CitizenAuthMode;
  next?: string;
}): string {
  const params = new URLSearchParams(input.searchParams?.toString() ?? "");
  params.set("auth", input.mode);

  const nextValue = input.next;
  if (isSafeNextPath(nextValue)) {
    params.set("next", nextValue);
    params.set("returnTo", nextValue);
  } else {
    params.delete("next");
    params.delete("returnTo");
  }

  const query = params.toString();
  return query ? `${input.pathname}?${query}` : input.pathname;
}

export function clearCitizenAuthQuery(
  pathname: string,
  searchParams: SearchParamsLike
): string {
  const params = new URLSearchParams(searchParams.toString());
  params.delete("auth");
  params.delete("next");
  params.delete("returnTo");
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}
