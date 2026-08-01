"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SignOutButton } from "@clerk/nextjs";
import { MCPConnectHint } from "./MCPConnectHint";

type NavItem = { href: string; label: string; exact?: boolean };

const NAV: readonly NavItem[] = [
  { href: "/admin/command-center", label: "Command Center" },
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/profile", label: "My Profile" },
  { href: "/admin/services", label: "Services" },
  { href: "/admin/testimonials", label: "Testimonials" },
  { href: "/admin/blog", label: "Blog" },
  { href: "/admin/newsletter", label: "Newsletter" },
  { href: "/admin/tokens", label: "Tokens" },
];

// Kept so mobile top bar can still resolve section labels for the pages
// that live outside the primary sidebar (Events, Developer, per-section
// content pages nested under My Profile).
const SECONDARY_NAV: readonly NavItem[] = [
  { href: "/admin/projects", label: "Projects" },
  { href: "/admin/career", label: "Career" },
  { href: "/admin/hackathons", label: "Hackathons" },
  { href: "/admin/leadership", label: "Leadership" },
  { href: "/admin/mentorship", label: "Mentorship" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/developer", label: "Developer" },
  { href: "/admin/landing", label: "Edit homepage" },
];

function isActive(pathname: string, href: string, exact?: boolean): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

function currentSectionLabel(pathname: string): string {
  const all = [...NAV, ...SECONDARY_NAV];
  const match = all.find((n) => isActive(pathname, n.href, n.exact));
  return match?.label ?? "Admin";
}

function NavLink({
  href,
  label,
  active,
  onNavigate,
}: {
  href: string;
  label: string;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
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

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <>
      <div className="border-b border-zinc-200 px-5 py-6">
        <Link
          href="/"
          onClick={onNavigate}
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
                onNavigate={onNavigate}
              />
            </li>
          ))}
        </ul>
      </nav>

      <div className="space-y-4 border-t border-zinc-200 px-5 py-4">
        <MCPConnectHint />
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/admin/developer"
            onClick={onNavigate}
            className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 transition-colors hover:text-zinc-900"
          >
            Developer
          </Link>
          <SignOutButton>
            <button className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 transition-colors hover:text-zinc-900">
              ← Sign out
            </button>
          </SignOutButton>
        </div>
      </div>
    </>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close drawer on route change.
  useEffect(() => setOpen(false), [pathname]);

  // Lock body scroll while mobile drawer is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {/* Mobile top bar — visible < md. Layout compensates with pt-14 md:pt-0. */}
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-4 md:hidden">
        <button
          type="button"
          aria-label="Open admin menu"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className="flex h-9 w-9 items-center justify-center border border-zinc-200 text-zinc-700 transition-colors hover:border-zinc-400 hover:text-zinc-900"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            className="h-4 w-4"
          >
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-700">
          {currentSectionLabel(pathname)}
        </p>
        <div className="w-9" aria-hidden />
      </div>

      {/* Desktop sidebar — sticky, always visible. */}
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-zinc-200 bg-white md:flex">
        <SidebarContent />
      </aside>

      {/* Mobile drawer — slides in from left. */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity md:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setOpen(false)}
        aria-hidden
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-zinc-200 bg-white transition-transform duration-200 ease-out md:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!open}
      >
        <SidebarContent onNavigate={() => setOpen(false)} />
      </aside>
    </>
  );
}
