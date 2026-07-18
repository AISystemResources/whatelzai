"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@clerk/nextjs";

type NavItem = { href: string; label: string; exact?: boolean };

const NAV: readonly NavItem[] = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/testimonials", label: "Testimonials" },
  { href: "/admin/landing", label: "Edit homepage" },
];

const CONTENT_NAV: readonly NavItem[] = [
  { href: "/admin/projects", label: "Projects" },
  { href: "/admin/blog", label: "Blog" },
  { href: "/admin/career", label: "Career" },
  { href: "/admin/hackathons", label: "Hackathons" },
  { href: "/admin/leadership", label: "Leadership" },
  { href: "/admin/mentorship", label: "Mentorship" },
];

function isActive(pathname: string, href: string, exact?: boolean): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

function NavLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`block border-l-2 px-3 py-2 font-mono text-xs uppercase tracking-widest transition-colors ${
        active
          ? "border-zinc-900 bg-zinc-50 text-zinc-900"
          : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-900"
      }`}
    >
      {label}
    </Link>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-screen w-56 shrink-0 flex-col border-r border-zinc-200 bg-white">
      <div className="border-b border-zinc-200 px-5 py-6">
        <Link
          href="/"
          className="font-mono text-xs font-semibold uppercase tracking-widest text-zinc-900 transition-opacity hover:opacity-60"
        >
          WHATELZ.AI
        </Link>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-zinc-400">
          Admin
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-0.5">
          {NAV.map((item) => (
            <li key={item.href}>
              <NavLink
                href={item.href}
                label={item.label}
                active={isActive(pathname, item.href, item.exact)}
              />
            </li>
          ))}
        </ul>

        <div className="mt-6 px-3 pb-2 font-mono text-[10px] uppercase tracking-widest text-zinc-400">
          Content
        </div>
        <ul className="space-y-0.5">
          {CONTENT_NAV.map((item) => (
            <li key={item.href}>
              <NavLink
                href={item.href}
                label={item.label}
                active={isActive(pathname, item.href)}
              />
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-zinc-200 px-5 py-4">
        <SignOutButton>
          <button className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 transition-colors hover:text-zinc-900">
            ← Sign out
          </button>
        </SignOutButton>
      </div>
    </aside>
  );
}
