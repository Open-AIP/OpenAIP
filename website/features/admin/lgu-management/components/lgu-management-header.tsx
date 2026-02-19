"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LguManagementHeader({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">LGU Management</h1>
        <p className="mt-2 text-sm text-slate-600 max-w-3xl">
          Maintain authoritative LGU master data and confirm fixed, system-locked budget category configuration used across the platform.
        </p>
      </div>

      <Button className="bg-teal-700 hover:bg-teal-800" onClick={onAdd}>
        <Plus className="h-4 w-4" />
        Add LGU
      </Button>
    </div>
  );
}

