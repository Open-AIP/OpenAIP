"use client";

import { usePathname } from "next/navigation";
import LandingFooter from "@/features/citizen/landing-content/components/layout/landing-footer";

export default function CitizenFooter() {
  const pathname = usePathname();

  if (pathname === "/" || pathname === "/dashboard") {
    return null;
  }

  return <LandingFooter className="mt-12" />;
}
