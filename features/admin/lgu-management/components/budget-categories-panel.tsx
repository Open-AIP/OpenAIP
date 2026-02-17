"use client";

import { Info, Lock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BUDGET_CATEGORIES } from "@/lib/constants/budget-categories";

export default function BudgetCategoriesPanel() {
  return (
    <Card className="border-slate-200">
      <CardHeader className="border-b border-slate-200">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base text-slate-900">
            Budget Categories
          </CardTitle>
          <Badge
            variant="outline"
            className="rounded-full border-slate-200 bg-slate-50 text-slate-700"
          >
            <Lock className="h-3 w-3" />
            System-Locked
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        <Alert className="border-sky-200 bg-sky-50 text-sky-900">
          <Info className="h-4 w-4 text-sky-700" />
          <AlertDescription className="text-sky-800">
            These budget categories are fixed across the platform and cannot be
            modified or removed. All AIPs must be categorized under one of these
            system-defined categories.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          {BUDGET_CATEGORIES.map((label) => (
            <div
              key={label}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
            >
              <div className="font-medium text-slate-800">{label}</div>
              <Lock className="h-4 w-4 text-slate-500" />
            </div>
          ))}
        </div>

        <div className="pt-2 text-xs text-slate-500">
          Note: These categories align with government budgeting standards and
          ensure consistency across all LGUs in the platform.
        </div>
      </CardContent>
    </Card>
  );
}
