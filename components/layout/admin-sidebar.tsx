"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/ui/utils";
import { ADMIN_NAV } from "@/constants/lgu-nav";

function isActive(pathname: string, href: string) {
  if (pathname === href) return true;
  if (href === "/admin") return false;
  if (href !== "/" && pathname.startsWith(href + "/")) return true;
  return false;
}

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[275px] shrink-0 bg-[#022437] text-white h-screen flex flex-col sticky top-0 overflow-y-auto">
      <div className="px-6 pt-8 pb-3">
        <div className="flex flex-col items-center gap-3">
          <Image src="/brand/logo3.svg" alt="OpenAIP Logo" width={100} height={100} className="h-25 w-25" />
          <div className="text-xs font-semibold leading-none">OpenAIP</div>
        </div>

        <div className="mt-6 rounded-xl bg-[#114B59] border border-white/10 p-3 shadow-sm">
          <div className="rounded-lg bg-[#1B6272] px-4 py-3 text-xs font-medium text-center">ADMIN</div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6">
        <ul className="space-y-2">
          {ADMIN_NAV.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-xs transition-colors",
                    "hover:bg-white/10",
                    active && "bg-[#2E6F7A] hover:bg-[#2E6F7A]"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
