'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { CITIZEN_NAV } from '@/features/citizen/constants/nav';
import { cn } from '@/ui/utils';

function isActivePath(pathname: string, href: string) {
  if (href === '/dashboard') return pathname === '/dashboard' || pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function CitizenTopNav() {
  const pathname = usePathname();
  const mobileSheetId = "citizen-mobile-nav-sheet";

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-[#D3DBE0]">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 md:px-8">
        <Link href="/dashboard" className="flex items-center gap-2" aria-label="OpenAIP home">
          <Image src="/brand/logo3.svg" alt="OpenAIP logo" width={32} height={32} className="h-8 w-8" priority />
          <span className="text-xl font-semibold tracking-tight text-slate-900">OpenAIP</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {CITIZEN_NAV.map((item) => {
            const active = isActivePath(pathname, item.href);
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
            <Link href="/sign-in">Sign In</Link>
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
                <Link href="/sign-in">Sign In</Link>
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
