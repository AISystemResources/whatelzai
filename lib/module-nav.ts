import type { PillKey } from './pill-access';

export type NavItem = {
  label: string;
  href: string;
};

export const MODULE_NAV: Record<PillKey, NavItem[]> = {
  home: [
    { label: 'Career',     href: '/#arc-heading' },
    { label: 'Projects',   href: '/#projects-heading' },
    { label: 'Hackathons', href: '/#wins-heading' },
    { label: 'Channels',   href: '/#channels' },
    { label: 'Contact',    href: '/#contact' },
  ],
  hackathons: [
    { label: 'All Hackathons', href: '/hackathons' },
  ],
  projects: [
    { label: 'Overview',   href: '/projects' },
    { label: 'Atlas',      href: '/projects/atlas' },
    { label: 'DoubleLead', href: '/projects/doublelead' },
    { label: 'whatelz.ai', href: '/projects/whatelz' },
  ],
  blog:     [],
  services: [],
  admin:    [],
};
