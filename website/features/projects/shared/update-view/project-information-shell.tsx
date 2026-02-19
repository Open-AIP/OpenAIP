import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ProjectInformationShell({
  breadcrumbLeft,
  breadcrumbRight,
  title,
  status,
  statusClassName,
  actionSlot,
  children,
}: {
  breadcrumbLeft: string;
  breadcrumbRight: string;
  title: string;
  status: string;
  statusClassName?: string;
  actionSlot?: React.ReactNode; // e.g. "+ Add Information"
  children: React.ReactNode;    // module-specific body
}) {
  return (
    <Card className="border-slate-200">
      <CardContent className="p-6">
        <div className="flex items-stretch justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xs text-slate-400">
              {breadcrumbLeft} / <span className="text-slate-600">{breadcrumbRight}</span>
            </div>

            <h1 className="mt-2 text-3xl font-bold text-slate-900">{title}</h1>
          </div>

          <div className="flex flex-col items-end gap-2">
            {actionSlot}
            <Badge variant="outline" className={`mt-auto rounded-full ${statusClassName ?? ""}`}>
              {status}
            </Badge>
          </div>
        </div>

        <div className="mt-6">{children}</div>
      </CardContent>
    </Card>
  );
}
