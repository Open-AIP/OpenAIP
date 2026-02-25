'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Menu, ChevronDown, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { buildCitizenAuthHref } from '@/features/citizen/auth/utils/auth-query';
import { CITIZEN_NAV } from '@/features/citizen/constants/nav';
import { cn } from '@/ui/utils';

function isActivePath(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function CitizenTopNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const mobileSheetId = "citizen-mobile-nav-sheet";
  const [mobileProjectsOpen, setMobileProjectsOpen] = useState<boolean>(false);

  const sanitizedNext = (() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("auth");
    params.delete("next");
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  })();

  const signInHref = buildCitizenAuthHref({
    pathname,
    searchParams,
    mode: "login",
    next: sanitizedNext,
  });

  useEffect(() => {
    setMobileProjectsOpen(pathname === '/projects' || pathname.startsWith('/projects/'));
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-[#D3DBE0]">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 md:px-8">
        <Link href="/" className="flex items-center gap-2" aria-label="OpenAIP home">
          <Image src="/brand/logo3.svg" alt="OpenAIP logo" width={32} height={32} className="h-8 w-8" priority />
          <span className="text-xl font-semibold tracking-tight text-slate-900">OpenAIP</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {CITIZEN_NAV.map((item) => {
            const active = isActivePath(pathname, item.href);
            if (item.children?.length) {
              return (
                <DropdownMenu key={item.href}>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={cn(
                        'inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                        active
                          ? 'text-[#0E7490]'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      )}
                    >
                      <span>{item.label}</span>
                      <ChevronDown className="h-4 w-4 text-slate-500" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    sideOffset={8}
                    className="w-52 rounded-lg border border-slate-300 bg-slate-100 p-1 shadow-lg"
                  >
                    {item.children.map((child) => {
                      const childActive = isActivePath(pathname, child.href);
                      return (
                        <DropdownMenuItem
                          asChild
                          key={child.href}
                          className={cn(
                            'cursor-pointer rounded-md px-3 py-2 text-base font-medium text-slate-700',
                            childActive ? 'bg-slate-200 text-slate-800' : 'hover:bg-slate-200'
                          )}
                        >
                          <Link href={child.href}>{child.label}</Link>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'border-b-2 border-[#0E7490] text-slate-900'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:block">
          <Button asChild className="bg-[#0E7490] text-white hover:bg-[#0C6078]">
            <Link href={signInHref}>Sign In</Link>
          </Button>
        </div>

        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="outline" size="icon" aria-label="Open menu" aria-controls={mobileSheetId}>
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent id={mobileSheetId} side="right" className="w-[280px]">
            <SheetTitle className="sr-only">Citizen navigation</SheetTitle>
            <div className="mt-8 flex flex-col gap-2">
              {CITIZEN_NAV.map((item) => {
                const active = isActivePath(pathname, item.href);
                if (item.children?.length) {
                  return (
                    <div key={item.href} className="rounded-md">
                      <button
                        type="button"
                        onClick={() => setMobileProjectsOpen((current) => !current)}
                        className={cn(
                          'flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors',
                          active ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-100'
                        )}
                      >
                        <span>{item.label}</span>
                        {mobileProjectsOpen ? (
                          <ChevronDown className="h-4 w-4 text-slate-500" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-slate-500" />
                        )}
                      </button>
                      {mobileProjectsOpen ? (
                        <div className="mt-1 ml-3 space-y-1 border-l border-slate-200 pl-3">
                          {item.children.map((child) => {
                            const childActive = isActivePath(pathname, child.href);
                            return (
                              <Link
                                key={child.href}
                                href={child.href}
                                className={cn(
                                  'block rounded-md px-3 py-2 text-sm font-medium transition-colors',
                                  childActive
                                    ? 'bg-slate-100 text-slate-900'
                                    : 'text-slate-600 hover:bg-slate-100'
                                )}
                              >
                                {child.label}
                              </Link>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      active ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-100'
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
            <div className="mt-6 border-t border-slate-200 pt-6">
              <Button asChild className="w-full bg-[#0E7490] text-white hover:bg-[#0C6078]">
                <Link href={signInHref}>Sign In</Link>
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
