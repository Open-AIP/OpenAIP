import { Suspense } from "react";
import { CitizenDashboardView } from "@/features/citizen/dashboard";

export default function CitizenDashboardPage() {
  return (
    <Suspense fallback={<div className="text-sm text-slate-500">Loading dashboard...</div>}>
      <CitizenDashboardView />
    </Suspense>
  );
}
