import type { ReactNode } from "react";
import type { LguVariant } from "@/types/navigation";
import LguSidebar from "@/components/layout/lgu-sidebar";
import LguTopbar from "@/components/layout/lgu-topbar";
import LguFooter from "@/components/layout/lgu-footer";

type Props = {
  variant: LguVariant;
  children: ReactNode;

  // Replace these with Supabase user data later
  userName?: string;
  roleLabel?: string;
  scopeDisplayName?: string;
};

export default function LguShell({
  variant,
  children,
  userName = "Juan Dela Cruz",
  roleLabel = variant === "barangay" ? "Barangay Official" : "City Official",
  scopeDisplayName,
}: Props) {
  const accountHref = variant === "barangay" ? "/barangay/account" : "/city/account";

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <LguSidebar variant={variant} scopeDisplayName={scopeDisplayName} />

      <div className="flex-1 min-w-0 flex flex-col">
        <LguTopbar name={userName} roleLabel={roleLabel} accountHref={accountHref} />

        <main className="flex-1 px-8 py-6">{children}</main>

        <LguFooter />
      </div>
    </div>
  );
}
