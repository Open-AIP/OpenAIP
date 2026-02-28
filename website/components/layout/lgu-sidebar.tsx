"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/ui/utils";
import type { LguVariant } from "@/types/navigation";
import { BARANGAY_NAV, CITY_NAV } from "@/constants/lgu-nav";

type Props = {
  variant: LguVariant;
  scopeDisplayName?: string;
};

function isActive(pathname: string, href: string) {
  // Exact match
  if (pathname === href) return true;
  // For root paths like "/barangay" or "/city", only match exact path
  if (href === "/barangay" || href === "/city") return false;
  // Nested route match (avoid "/" edge cases)
  if (href !== "/" && pathname.startsWith(href + "/")) return true;
  return false;
}

function isParentActive(pathname: string, href: string, hasChildren: boolean) {
  // If has children, only highlight on exact match, not when children are active
  if (hasChildren) {
    return pathname === href;
  }
  // Otherwise use normal active logic
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
    <aside className="w-68.75 shrink-0 bg-[#022437] text-white h-screen flex flex-col sticky top-0 overflow-y-auto">
      {/* Brand */}
      <div className="px-6 pt-8 pb-3">
        <div className="flex flex-col items-center gap-3">
          <Image 
            src="/brand/logo3.svg" 
            alt="OpenAIP Logo" 
            width={100} 
            height={100}
            className="h-20 w-20"
          />
          <div className="text-3xl font-semibold leading-none">OpenAIP</div>
        </div>

        <div className="mt-6 h-21 rounded-[9px] border-2 border-[#1B6272] bg-[#114B59] shadow-[0_4px_4px_rgba(0,0,0,0.25)] flex items-center justify-center px-4 text-sm font-semibold text-center">
          {headerLabel}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6">
        <ul className="space-y-2">
          {nav.map((item) => {
            const Icon = item.icon;
            const hasChildren = Boolean(item.children && item.children.length > 0);
            const active = isParentActive(pathname, item.href, hasChildren);
            const isOpen = openDropdowns.includes(item.href);

            return (
              <li key={item.href}>
                {hasChildren ? (
                  <div>
                    <button
                      onClick={() => toggleDropdown(item.href)}
                      className={cn(
                        "w-full flex items-center gap-3 rounded-xl px-4 py-3 text-xs transition-colors",
                        "hover:bg-white/10",
                        active && "bg-[#2E6F7A] hover:bg-[#2E6F7A]"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium flex-1 text-left">{item.label}</span>
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
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
                ) : (
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
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
