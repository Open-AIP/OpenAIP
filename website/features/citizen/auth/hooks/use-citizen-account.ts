"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CitizenAccountProfile } from "@/features/citizen/auth/types";
import { supabaseBrowser } from "@/lib/supabase/client";

type ProfileApiResponse = {
  ok?: boolean;
  error?: {
    message?: string;
  };
} & Partial<CitizenAccountProfile>;

type UseCitizenAccountResult = {
  isLoading: boolean;
  isAuthenticated: boolean;
  profile: CitizenAccountProfile | null;
  error: string | null;
  refresh: () => Promise<void>;
};

function toErrorMessage(payload: ProfileApiResponse | null, fallback: string): string {
  const fromPayload = payload?.error?.message;
  if (typeof fromPayload === "string" && fromPayload.trim().length > 0) {
    return fromPayload;
  }
  return fallback;
}

function isCompleteProfilePayload(payload: ProfileApiResponse | null): payload is CitizenAccountProfile {
  if (!payload || payload.ok !== true) return false;
  return (
    typeof payload.fullName === "string" &&
    typeof payload.email === "string" &&
    typeof payload.firstName === "string" &&
    typeof payload.lastName === "string" &&
    typeof payload.barangay === "string" &&
    typeof payload.city === "string" &&
    typeof payload.province === "string"
  );
}

export function useCitizenAccount(): UseCitizenAccountResult {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [profile, setProfile] = useState<CitizenAccountProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    if (mountedRef.current) {
      setIsLoading(true);
    }

    const { data, error: authError } = await supabase.auth.getUser();
    if (!mountedRef.current) return;

    if (authError || !data.user?.id) {
      setIsAuthenticated(false);
      setProfile(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsAuthenticated(true);

    const response = await fetch("/profile/me", {
      method: "GET",
      cache: "no-store",
    });
    const payload = (await response.json().catch(() => null)) as ProfileApiResponse | null;
    if (!mountedRef.current) return;

    if (response.status === 401) {
      setIsAuthenticated(false);
      setProfile(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    if (!response.ok || !isCompleteProfilePayload(payload)) {
      setProfile(null);
      setError(toErrorMessage(payload, "Unable to load account profile."));
      setIsLoading(false);
      return;
    }

    setProfile(payload);
    setError(null);
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    void refresh();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      void refresh();
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [refresh, supabase.auth]);

  return {
    isLoading,
    isAuthenticated,
    profile,
    error,
    refresh,
  };
}
