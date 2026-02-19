"use client";

import Link from "next/link";
import { User } from "lucide-react";

type Props = {
  name: string;
  roleLabel: string;
  accountHref: string;
};

export default function LguTopbar({ name, roleLabel, accountHref }: Props) {
  return (
    <header className="w-full bg-white">
      <div className="h-16 px-8 flex items-center justify-end gap-4">
        <div className="text-right leading-tight">
          <div className="text-sm font-semibold text-slate-900">{name}</div>
          <div className="text-xs text-slate-500">{roleLabel}</div>
        </div>

        <Link
          href={accountHref}
          className="h-10 w-10 rounded-full bg-[#0B3440] grid place-items-center"
          aria-label="Account"
        >
          <User className="h-5 w-5 text-white" />
        </Link>
      </div>
    </header>
  );
}
