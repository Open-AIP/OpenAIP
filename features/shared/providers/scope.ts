"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import type { RoleType } from "@/lib/contracts/databasev2/enums";
import {
  BARANGAY_DASHBOARD_SCOPE,
  CITY_DASHBOARD_SCOPE,
} from "@/lib/constants/mock-scope";

export type ScopeType = "city" | "barangay" | "municipality" | "none";

export type ScopeContext = {
  scope_type: ScopeType;
  scope_id: string;
  role: RoleType;
  scope_name: string;
  barangay_id: string | null;
  city_id: string | null;
  municipality_id: string | null;
};

const SCOPE_CONTEXTS: Record<ScopeType, ScopeContext> = {
  barangay: {
    scope_type: "barangay",
    scope_id: BARANGAY_DASHBOARD_SCOPE.barangayId,
    role: BARANGAY_DASHBOARD_SCOPE.role,
    scope_name: BARANGAY_DASHBOARD_SCOPE.barangayName,
    barangay_id: BARANGAY_DASHBOARD_SCOPE.barangayId,
    city_id: BARANGAY_DASHBOARD_SCOPE.cityId,
    municipality_id: null,
  },
  city: {
    scope_type: "city",
    scope_id: CITY_DASHBOARD_SCOPE.cityId,
    role: "city_official",
    scope_name: CITY_DASHBOARD_SCOPE.cityName,
    barangay_id: null,
    city_id: CITY_DASHBOARD_SCOPE.cityId,
    municipality_id: null,
  },
  municipality: {
    scope_type: "municipality",
    scope_id: "municipality_001",
    role: "municipal_official",
    scope_name: "Default Municipality",
    barangay_id: null,
    city_id: null,
    municipality_id: "municipality_001",
  },
  none: {
    scope_type: "none",
    scope_id: "none",
    role: "admin",
    scope_name: "Unscoped",
    barangay_id: null,
    city_id: null,
    municipality_id: null,
  },
};

function inferScopeType(pathname: string): ScopeType {
  if (pathname.startsWith("/barangay")) return "barangay";
  if (pathname.startsWith("/city")) return "city";
  if (pathname.startsWith("/municipality")) return "municipality";
  return "none";
}

export function useScope(): ScopeContext {
  const pathname = usePathname();

  return useMemo(() => {
    const scopeType = inferScopeType(pathname ?? "");
    return SCOPE_CONTEXTS[scopeType];
  }, [pathname]);
}
