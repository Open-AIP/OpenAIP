"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import CitizenAuthModal from "@/features/citizen/auth/components/CitizenAuthModal";
import {
  buildCitizenAuthHref,
  clearCitizenAuthQuery,
  parseCitizenAuthQuery,
} from "@/features/citizen/auth/utils/auth-query";
import type { CitizenAuthMode } from "@/features/citizen/auth/types";

export default function CitizenAuthModalHost() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const parsedQuery = useMemo(
    () => parseCitizenAuthQuery(searchParams),
    [searchParams]
  );

  const isOpen = parsedQuery.mode !== null;

  const closeModal = () => {
    const href = clearCitizenAuthQuery(pathname, searchParams);
    router.replace(href, { scroll: false });
  };

  const setMode = (mode: CitizenAuthMode) => {
    const href = buildCitizenAuthHref({
      pathname,
      searchParams,
      mode,
      next: parsedQuery.next ?? undefined,
    });
    router.replace(href, { scroll: false });
  };

  if (!parsedQuery.mode) {
    return null;
  }

  return (
    <CitizenAuthModal
      isOpen={isOpen}
      mode={parsedQuery.mode}
      nextPath={parsedQuery.next}
      onClose={closeModal}
      onModeChange={setMode}
    />
  );
}
