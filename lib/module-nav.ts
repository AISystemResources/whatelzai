import type { PillKey } from './pill-access';

export type NavItem = {
  label: string;
  href: string;
};

// Populated in sprints 036–039
export const MODULE_NAV: Record<PillKey, NavItem[]> = {
  home:       [],
  hackathons: [],
  projects:   [],
  blog:       [],
  services:   [],
  admin:      [],
};
