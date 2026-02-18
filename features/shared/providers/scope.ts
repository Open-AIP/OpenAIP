"use client";

import { createContext, createElement, useContext, type ReactNode } from "react";
import type { ScopeContextValue } from "@/lib/auth/scope-context";

export type ScopeContext = ScopeContextValue;

const DEFAULT_SCOPE_CONTEXT: ScopeContext = {
  scope_type: "none",
  scope_id: "",
  role: "admin",
  scope_name: "Unscoped",
  barangay_id: null,
  city_id: null,
  municipality_id: null,
};

const ScopeContextProvider = createContext<ScopeContext>(DEFAULT_SCOPE_CONTEXT);

export function ScopeProvider({
  value,
  children,
}: {
  value: ScopeContext;
  children: ReactNode;
}) {
  return createElement(ScopeContextProvider.Provider, { value }, children);
}

export function useScope(): ScopeContext {
  return useContext(ScopeContextProvider);
}
