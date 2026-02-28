import type { ReactNode } from "react";
import { UserCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AipAccountability } from "@/features/citizen/aips/types";

type Props = {
  accountability: AipAccountability;
};

const RowLabel = ({ children }: { children: string }) => (
  <p className="text-sm font-semibold text-slate-800">{children}</p>
);

const MutedRow = ({ children }: { children: ReactNode }) => (
  <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">{children}</div>
);

const PersonRow = ({
  label,
  person,
}: {
  label: string;
  person?: { name: string; roleLabel?: string } | null;
}) => (
  <div className="space-y-3">
    <RowLabel>{label}</RowLabel>
    <MutedRow>
      <UserCircle className="mt-1 h-6 w-6 text-slate-500" />
      {person ? (
        <div className="space-y-1 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">{person.name}</p>
          {person.roleLabel && <p>{person.roleLabel}</p>}
        </div>
      ) : (
        <p className="text-sm text-slate-500">N/A</p>
      )}
    </MutedRow>
  </div>
);

export default function AipAccountabilityCard({ accountability }: Props) {
  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="text-3xl text-slate-900">Accountability Information</CardTitle>
        <CardDescription className="text-base">
          Officials responsible for this AIP submission and approval
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-6 divide-y divide-slate-200">
          <div className="space-y-6 pb-6">
            <PersonRow label="Uploaded by:" person={accountability.uploadedBy ?? null} />
          </div>
          <div className="space-y-6 py-6">
            <PersonRow label="Reviewed by:" person={accountability.reviewedBy ?? null} />
          </div>
          <div className="space-y-6 pt-6">
            <PersonRow label="Approved by:" person={accountability.approvedBy ?? null} />
          </div>
        </div>

        <div className="grid gap-4 text-sm text-slate-700 md:grid-cols-2">
          <div>
            <RowLabel>Upload Date</RowLabel>
            <p className="mt-1">{accountability.uploadDate ? new Date(accountability.uploadDate).toLocaleDateString("en-PH") : "N/A"}</p>
          </div>
          <div>
            <RowLabel>Approval Date</RowLabel>
            <p className="mt-1">{accountability.approvalDate ? new Date(accountability.approvalDate).toLocaleDateString("en-PH") : "N/A"}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
