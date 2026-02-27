"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/ui/utils";
import type { LguVariant } from "@/types/navigation";
import { BARANGAY_NAV, CITY_NAV } from "@/constants/lgu-nav";
import { LogoutButton } from "@/components/logout-button";

type Props = {
  variant: LguVariant;
  scopeDisplayName?: string;
};

function isActive(pathname: string, href: string) {
  if (pathname === href) return true;
  if (href === "/barangay" || href === "/city") return false;
  if (href !== "/" && pathname.startsWith(href + "/")) return true;
  return false;
}

function isParentActive(pathname: string, href: string, hasChildren: boolean) {
  if (hasChildren) return pathname === href;
  return isActive(pathname, href);
}

function formatHeaderLabel(variant: LguVariant, scopeDisplayName?: string): string {
  const fallback = variant === "barangay" ? "Barangay Management" : "City Management";
  const trimmedName = typeof scopeDisplayName === "string" ? scopeDisplayName.trim() : "";
  if (!trimmedName) return fallback;

  if (variant === "barangay") {
    if (/^(barangay|brgy\.?)/i.test(trimmedName)) return trimmedName;
    return `Barangay ${trimmedName}`;
  }

  if (/city/i.test(trimmedName)) return trimmedName;
  return `${trimmedName} City`;
}

export default function LguSidebar({ variant, scopeDisplayName }: Props) {
  const pathname = usePathname();
  const nav = variant === "barangay" ? BARANGAY_NAV : CITY_NAV;

  const [openDropdowns, setOpenDropdowns] = useState<string[]>([]);
  const headerLabel = formatHeaderLabel(variant, scopeDisplayName);

  const toggleDropdown = (href: string) => {
    setOpenDropdowns((prev) =>
      prev.includes(href) ? prev.filter((item) => item !== href) : [...prev, href]
    );
  };

  return (
    <aside
      className={cn(
        // ✅ Width collapses on small screens, full on md+
        "shrink-0 sticky top-0 bg-[#022437] text-white flex flex-col",
        "w-16 md:w-72",

        // ✅ Use dvh for better mobile sizing, prevent sidebar scrollbar by default
        "h-dvh overflow-hidden"
      )}
    >
      {/* Brand */}
      <div className="pt-4 md:pt-8 pb-2 md:pb-3 px-2 md:px-6">
        <div className="flex flex-col items-center gap-2 md:gap-3">
          <Image
            src="/brand/logo3.svg"
            alt="OpenAIP Logo"
            width={100}
            height={100}
            className="h-10 w-10 md:h-20 md:w-20"
          />

          {/* ✅ Hide text on small screens to avoid overflow */}
          <div className="hidden md:block text-3xl font-semibold leading-none">OpenAIP</div>
        </div>

        {/* ✅ Hide the big header card on small screens (it causes overflow) */}
        <div className="hidden md:flex mt-6 h-21 rounded-[9px] border-2 border-[#1B6272] bg-[#114B59] shadow-[0_4px_4px_rgba(0,0,0,0.25)] items-center justify-center px-4 text-lg font-semibold text-center">
          {headerLabel}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-1 md:px-4 pb-3 md:py-6">
        <ul className="space-y-1 md:space-y-2">
          {nav.map((item) => {
            const Icon = item.icon;
            const hasChildren = Boolean(item.children && item.children.length > 0);
            const active = isParentActive(pathname, item.href, hasChildren);
            const isOpen = openDropdowns.includes(item.href);

            // ✅ Common link/button styles (compact on small, roomy on md+)
            const baseRowClass = cn(
              "w-full flex items-center rounded-xl transition-colors",
              "hover:bg-white/10",
              active && "bg-[#2E6F7A] hover:bg-[#2E6F7A]",
              // sizing
              "h-10 md:h-11",
              // padding
              "px-2 md:px-4",
              // text
              "text-[11px] md:text-xs"
            );

            return (
              <li key={item.href}>
                {hasChildren ? (
                  <div>
                    {/* ✅ On small screens: keep it simple (no dropdown expansion) */}
                    <button
                      type="button"
                      onClick={() => toggleDropdown(item.href)}
                      className={cn(baseRowClass, "gap-0 md:gap-3")}
                    >
                      <Icon className="h-5 w-5 md:h-5 md:w-5 mx-auto md:mx-0" />

                      {/* ✅ Label only on md+ */}
                      <span className="hidden md:block font-medium flex-1 text-left">
                        {item.label}
                      </span>

                      {/* ✅ Chevron only on md+ */}
                      <span className="hidden md:block">
                        {isOpen ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </span>
                    </button>

                    {/* ✅ Children ONLY render on md+ (prevents overflow/scrollbar on small) */}
                    <div className="hidden md:block">
                      {isOpen && (
                        <ul className="ml-4 mt-1 space-y-1">
                          {item.children?.map((child) => {
                            const childActive = isActive(pathname, child.href);
                            const ChildIcon = child.icon;

                            return (
                              <li key={child.href}>
                                <Link
                                  href={child.href}
                                  className={cn(
                                    "flex items-center gap-3 rounded-xl px-4 py-2 text-xs transition-colors",
                                    "hover:bg-white/10",
                                    childActive && "bg-[#2E6F7A] hover:bg-[#2E6F7A]"
                                  )}
                                >
                                  <ChildIcon className="h-4 w-4" />
                                  <span className="font-medium">{child.label}</span>
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  </div>
                ) : (
                  <Link href={item.href} className={cn(baseRowClass, "gap-0 md:gap-3")}>
                    <Icon className="h-5 w-5 mx-auto md:mx-0" />
                    <span className="hidden md:block font-medium">{item.label}</span>
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer / Logout */}
      <div className="mt-auto p-2 md:p-4">
        {/* ✅ Compact logout area on small */}
        <div className="rounded-xl p-1 md:p-2">
          <LogoutButton role={variant} baseURL={process.env.NEXT_PUBLIC_API_BASE_URL || ""} />
        </div>
      </div>
    </aside>
  );
}
