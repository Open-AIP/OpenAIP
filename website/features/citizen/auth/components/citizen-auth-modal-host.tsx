"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import CitizenAuthModal from "@/features/citizen/auth/components/citizen-auth-modal";
import {
  buildCitizenAuthHref,
  clearCitizenAuthQuery,
  isSafeNextPath,
  parseCitizenAuthQuery,
  readReturnToFromSessionStorage,
  setReturnToInSessionStorage,
} from "@/features/citizen/auth/utils/auth-query";
import type { CitizenAuthMode } from "@/features/citizen/auth/types";

export default function CitizenAuthModalHost() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [returnTo, setReturnTo] = useState<string | null>(null);

  const parsedQuery = useMemo(
    () => parseCitizenAuthQuery(searchParams),
    [searchParams]
  );

  const isOpen = parsedQuery.mode !== null || parsedQuery.forceCompleteProfile;

  useEffect(() => {
    const candidate = parsedQuery.next ?? readReturnToFromSessionStorage();
    if (isSafeNextPath(candidate)) {
      setReturnTo(candidate);
      setReturnToInSessionStorage(candidate);
      return;
    }
    setReturnTo(null);
  }, [parsedQuery.next]);

  const closeModal = () => {
    if (parsedQuery.forceCompleteProfile) {
      return;
    }
    const href = clearCitizenAuthQuery(pathname, searchParams);
    router.replace(href, { scroll: false });
  };

  const setMode = (mode: CitizenAuthMode | null) => {
    const href = buildCitizenAuthHref({
      pathname,
      searchParams,
      mode,
      launchStep: mode ? "email" : parsedQuery.launchStep,
      completeProfile: parsedQuery.forceCompleteProfile,
      next: returnTo ?? parsedQuery.next ?? undefined,
    });
    router.replace(href, { scroll: false });
  };

  if (!isOpen) {
    return null;
  }

  return (
    <CitizenAuthModal
      isOpen={isOpen}
      mode={parsedQuery.mode}
      launchStep={parsedQuery.launchStep}
      nextPath={returnTo ?? parsedQuery.next}
      forceCompleteProfile={parsedQuery.forceCompleteProfile}
      onClose={closeModal}
      onModeChange={setMode}
    />
  );
}
