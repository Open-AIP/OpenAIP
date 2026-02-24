import { CardContent } from "@/components/ui/card";
import CardShell from "./CardShell";

type KpiCardProps = {
  label: string;
  value: string;
  delta?: string;
};

export default function KpiCard({ label, value, delta }: KpiCardProps) {
  return (
    <CardShell className="py-0">
      <CardContent className="space-y-1 px-5 py-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        <p className="text-2xl font-semibold text-[#0C2C3A]">{value}</p>
        {delta ? <p className="text-xs text-slate-500">{delta}</p> : null}
      </CardContent>
    </CardShell>
  );
}

