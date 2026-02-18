'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CITIZEN_NAV } from '@/features/citizen/constants/nav';
import { cn } from '@/ui/utils';

function isActivePath(pathname: string, href: string) {
  if (href === '/dashboard') return pathname === '/dashboard' || pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function CitizenTopNav() {
  const pathname = usePathname();
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const projectsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!projectsRef.current) return;
      if (!projectsRef.current.contains(event.target as Node)) {
        setProjectsOpen(false);
      }
    }

    function onEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setProjectsOpen(false);
        setMobileOpen(false);
      }
    }

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onEscape);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-[#D3DBE0]">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 md:px-8">
        <Link href="/dashboard" className="flex items-center gap-2" aria-label="OpenAIP home">
          <Image src="/brand/logo3.svg" alt="OpenAIP logo" width={32} height={32} className="h-8 w-8" priority />
          <span className="text-xs font-semibold tracking-tight text-slate-900">OpenAIP</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {CITIZEN_NAV.map((item) => {
            const active =
              isActivePath(pathname, item.href) ||
              item.children?.some((child) => isActivePath(pathname, child.href));

            if (item.children && item.children.length > 0) {
              return (
                <div key={item.href} className="relative" ref={projectsRef}>
                  <button
                    type="button"
                    aria-haspopup="menu"
                    aria-expanded={projectsOpen}
                    onClick={() => setProjectsOpen((prev) => !prev)}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-md px-3 py-2 text-xs font-medium transition-colors',
                      active
                        ? 'border-b-2 border-[#0E7490] text-slate-900'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    )}
                  >
                    {item.label}
                    <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', projectsOpen ? 'rotate-180' : 'rotate-0')} />
                  </button>
                  {projectsOpen ? (
                    <div
                      role="menu"
                      className="absolute left-0 mt-2 min-w-[170px] rounded-md border border-slate-200 bg-white p-1 shadow-md"
                    >
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="block rounded-md px-3 py-2 text-xs text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900"
                          onClick={() => setProjectsOpen(false)}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setProjectsOpen(false)}
                className={cn(
                  'rounded-md px-3 py-2 text-xs font-medium transition-colors',
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
          <Button asChild className="bg-[#0E7490] text-white hover:bg-[#0C6078] text-xs">
            <Link href="/sign-in">Sign In</Link>
          </Button>
        </div>

        <Button
          variant="outline"
          size="icon"
          aria-label="Open menu"
          className="md:hidden"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {mobileOpen ? (
        <div className="md:hidden">
          <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="fixed right-0 top-0 z-50 h-full w-[280px] border-l border-slate-200 bg-white p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-900">Menu</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Close menu"
                onClick={() => setMobileOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="mt-6 flex flex-col gap-2">
              {CITIZEN_NAV.map((item) => {
                const active =
                  isActivePath(pathname, item.href) ||
                  item.children?.some((child) => isActivePath(pathname, child.href));
                return (
                  <div key={item.href} className="space-y-1">
                    <Link
                      href={item.href}
                      className={cn(
                        'w-full rounded-md px-3 py-2 text-left text-xs font-medium transition-colors',
                        active ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-100'
                      )}
                      onClick={() => setMobileOpen(false)}
                    >
                      {item.label}
                    </Link>
                    {item.children ? (
                      <div className="ml-4 flex flex-col gap-1">
                        {item.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={cn(
                              'rounded-md px-3 py-2 text-xs font-medium transition-colors',
                              isActivePath(pathname, child.href)
                                ? 'bg-slate-100 text-slate-900'
                                : 'text-slate-600 hover:bg-slate-100'
                            )}
                            onClick={() => setMobileOpen(false)}
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
            <div className="mt-6 border-t border-slate-200 pt-6">
              <Button asChild className="w-full bg-[#0E7490] text-white hover:bg-[#0C6078] text-xs">
                <Link href="/sign-in" onClick={() => setMobileOpen(false)}>
                  Sign In
                </Link>
              </Button>
            </div>
          </aside>
        </div>
      ) : null}
    </header>
  );
}
