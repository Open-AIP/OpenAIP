export type CitizenNavItem = {
  label: string;
  href: string;
};

export const CITIZEN_NAV: CitizenNavItem[] = [
  { label: 'Dashboard', href: '/' },
  { label: 'AIPs', href: '/aips' },
  { label: 'Budget Allocation', href: '/budget-allocation' },
  { label: 'Projects', href: '/projects' },
  { label: 'About us', href: '/about-us' },
];
