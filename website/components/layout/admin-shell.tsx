import type { ReactNode } from "react";
import AdminSidebar from "@/components/layout/admin-sidebar";

type Props = {
  children: ReactNode;
};

export default function AdminShell({ children }: Props) {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      <AdminSidebar />

      <div className="flex-1 min-w-0 flex flex-col">
        <main className="flex-1 px-8 py-6">{children}</main>
      </div>
    </div>
  );
}

