import type { ReactNode } from "react";
import AdminSidebar from "@/components/layout/admin-sidebar";
import Link from "next/link";
import { User } from "lucide-react";

type Props = {
  children: ReactNode;
  profileName?: string;
  profileRole?: string;
};

export default function AdminShell({
  children,
  profileName = "Admin User",
  profileRole = "System Administration",
}: Props) {
  return (
    <div className="min-h-screen bg-[#F3F5F7] flex">
      <AdminSidebar />

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-17 border-b border-slate-200 bg-white px-6 flex items-center justify-end">
          <div className="flex items-center gap-3">
            <div className="text-right leading-tight">
              <div className="text-sm font-medium text-slate-900">{profileName}</div>
              <div className="text-xs text-slate-500">{profileRole}</div>
            </div>
            <Link
              href="/admin/account-administration"
              className="h-10 w-10 rounded-full bg-[#0B3440] grid place-items-center"
              aria-label="Account"
            >
              <User className="h-5 w-5 text-white" />
            </Link>
          </div>
        </header>
        <main className="flex-1 px-8 py-6">{children}</main>
      </div>
    </div>
  );
}

