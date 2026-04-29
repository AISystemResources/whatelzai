export type PillKey = 'home' | 'hackathons' | 'projects' | 'blog' | 'services' | 'admin';

export type Pill = {
  key: PillKey;
  label: string;
  route: string;
  gated: boolean;
};

export const PILLS: Pill[] = [
  { key: 'home',       label: 'Home',       route: '/',           gated: false },
  { key: 'hackathons', label: 'Hackathons', route: '/hackathons', gated: false },
  { key: 'projects',   label: 'Projects',   route: '/projects',   gated: false },
  { key: 'blog',       label: 'Blog',       route: '/blog',       gated: false },
  { key: 'services',   label: 'Services',   route: '/services',   gated: false },
  { key: 'admin',      label: 'Admin',      route: '/admin',      gated: true  },
];

export function pillForPath(pathname: string): PillKey {
  if (pathname.startsWith('/admin'))      return 'admin';
  if (pathname.startsWith('/hackathons')) return 'hackathons';
  if (pathname.startsWith('/projects'))   return 'projects';
  if (pathname.startsWith('/blog'))       return 'blog';
  if (pathname.startsWith('/services'))   return 'services';
  return 'home';
}
