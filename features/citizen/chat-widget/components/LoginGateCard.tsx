import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LoginGateVM } from "@/lib/types/viewmodels";

export default function LoginGateCard({ vm }: { vm: LoginGateVM }) {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="mx-6 w-full rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-amber-100 text-amber-600">
          <Lock className="h-5 w-5" />
        </div>
        <div className="text-sm font-semibold text-slate-900">{vm.title}</div>
        <p className="mt-1 text-xs text-slate-500">{vm.description}</p>
        <Button asChild className="mt-4 h-8 rounded-full bg-[#0b5164] px-6 text-xs text-white hover:bg-[#0b5164]/90">
          <Link href="/sign-in">{vm.actionLabel}</Link>
        </Button>
      </div>
    </div>
  );
}
