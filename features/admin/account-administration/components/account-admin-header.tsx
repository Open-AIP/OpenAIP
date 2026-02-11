"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AccountAdminHeader({
  onCreateOfficial,
}: {
  onCreateOfficial: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Account Administration</h1>
        <p className="mt-2 text-sm text-slate-600 max-w-3xl">
          Manage official (barangay and city) accounts and citizen accounts while enforcing RBAC rules and account lifecycle controls.
        </p>
      </div>

      <Button className="bg-teal-700 hover:bg-teal-800" onClick={onCreateOfficial}>
        <Plus className="h-4 w-4" />
        Create Official Account
      </Button>
    </div>
  );
}

