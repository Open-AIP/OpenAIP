import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CityAipCoverageVM } from "../types";

type CityAipCoverageCardProps = {
  cityAipCoverage: CityAipCoverageVM;
  onUploadCityAip?: () => void;
};

export default function CityAipCoverageCard({ cityAipCoverage, onUploadCityAip }: CityAipCoverageCardProps) {
  const missing = cityAipCoverage.status === "missing";

  return (
    <Card className="gap-4 border-slate-200 py-4">
      <CardHeader className="px-4">
        <CardTitle className="text-2xl font-semibold">City AIP Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-4">
        <div
          className={`rounded-lg p-4 text-sm ${
            missing
              ? "border border-rose-200 bg-rose-50 text-rose-700"
              : "border border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {missing ? (
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="h-4 w-4" />
              <span>Missing City AIP</span>
            </div>
          ) : (
            <div className="font-semibold">City AIP Available</div>
          )}
          <div className="mt-1">{cityAipCoverage.message}</div>
        </div>

        <Button className="w-full bg-teal-700 text-white hover:bg-teal-800" onClick={onUploadCityAip}>
          {cityAipCoverage.ctaLabel ?? "Upload City AIP"}
        </Button>
      </CardContent>
    </Card>
  );
}
