import { AlertTriangle, Building2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { CityAipCoverageVM } from "../types";

type CityAipCoverageCardProps = {
  cityAipCoverage: CityAipCoverageVM;
  onUploadCityAip?: () => void;
};

export default function CityAipCoverageCard({ cityAipCoverage, onUploadCityAip }: CityAipCoverageCardProps) {
  const missing = cityAipCoverage.status === "missing";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Building2 className="h-5 w-5 text-teal-700" />
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">City AIP Status</h2>
      </div>

      <Card className="border-slate-200 py-0">
        <CardContent className="space-y-4 p-5">
          <h3 className="text-md font-medium text-slate-800">City AIP Coverage</h3>

          <div
            className={`rounded-lg border p-4 text-sm ${
              missing ? "border-rose-200 bg-white text-rose-600" : "border-emerald-200 bg-white text-emerald-700"
            }`}
          >
            {missing ? (
              <>
                <div className="flex items-center gap-2 font-medium">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Missing City AIP</span>
                </div>
                <p className="mt-1 ml-6">{cityAipCoverage.message}</p>
              </>
            ) : (
              <div className="font-medium">{cityAipCoverage.message}</div>
            )}
          </div>

          <Button className="w-full gap-2 bg-teal-700 text-white hover:bg-teal-800" onClick={onUploadCityAip}>
            <Upload className="h-4 w-4" />
            {cityAipCoverage.ctaLabel ?? "Upload City AIP"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
