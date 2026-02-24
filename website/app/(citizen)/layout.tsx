"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import CitizenFooter from "@/features/citizen/components/CitizenFooter";
import FloatingChatButton from "@/features/citizen/components/FloatingChatButton";
import CitizenTopNav from "@/features/citizen/components/CitizenTopNav";
import { cn } from "@/ui/utils";

const CitizenLayout = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const normalizedPathname = pathname.replace(/\/+$/, "") || "/";
  const isLandingDashboard = normalizedPathname === "/";

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-[#D3DBE0] to-[#FFFFFF]">
      <CitizenTopNav />
      <main
        className={cn(
          "mx-auto w-full flex-1",
          isLandingDashboard ? "m-0 max-w-none p-0" : "max-w-screen-2xl px-4 py-6 md:px-8 md:py-8"
        )}
      >
        {children}
      </main>
      <CitizenFooter />
      <FloatingChatButton />
    </div>
  );
};

export default CitizenLayout;
