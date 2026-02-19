export type CitizenNavItem = {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
};

export const CITIZEN_NAV: CitizenNavItem[] = [
  { label: 'Dashboard', href: '/' },
  { label: 'AIPs', href: '/aips' },
  { label: 'Budget Allocation', href: '/budget-allocation' },
  {
    label: 'Projects',
    href: '/projects',
    children: [
      { label: 'Health Projects', href: '/projects/health' },
      { label: 'Infrastructure Projects', href: '/projects/infrastructure' },
    ],
  },
  { label: 'About us', href: '/about-us' },
];
