"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/ui/utils";
import { ADMIN_NAV } from "@/constants/lgu-nav";
import { LogoutButton } from "@/components/logout-button";

function isActive(pathname: string, href: string) {
  if (pathname === href) return true;
  if (href === "/admin") return false;
  if (href !== "/" && pathname.startsWith(href + "/")) return true;
  return false;
}

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="h-screen w-68.75 shrink-0 sticky top-0 overflow-y-auto bg-[#022437] text-white flex flex-col">
      <div className="px-4 pt-4 pb-3">
        <div className="flex flex-col items-center gap-1">
          <Image
            src="/brand/logo3.svg"
            alt="OpenAIP Logo"
            width={178}
            height={177}
            className="h-20 w-20 object-contain"
          />
          <div className="text-[32px] leading-none font-light tracking-tight">OpenAIP</div>
        </div>

        <div className="mt-5 rounded-[10px] border border-[#1B6272] bg-[#114B59] p-1 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1)]">
          <div
            className="h-14 rounded-xl bg-[#2E6F8A] flex items-center justify-center text-[32px] leading-none font-normal"
            style={{ fontFamily: "var(--font-arsenal-sc), serif" }}
          >
            Admin
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-3">
        <ul className="space-y-1">
          {ADMIN_NAV.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex h-11 items-center gap-3 rounded-[10px] px-4 text-[12px] transition-colors text-[#B7D8E2]",
                    "hover:bg-white/10",
                    active && "bg-[#2E6F7A] text-white hover:bg-[#2E6F7A]"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="font-medium leading-5">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-auto px-4 pb-4 pt-2">
        <div className="rounded-[10px] border border-[#1B6272] bg-[#114B59] p-2">
          <LogoutButton role="admin" baseURL={process.env.NEXT_PUBLIC_API_BASE_URL || ""} />
        </div>
      </div>
    </aside>
  );
}
