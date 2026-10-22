"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { House, Settings2, Sunrise, UsersRound } from "lucide-react";
import { adminUrl } from "@/lib/admin-url";
import {
  adminNavigation,
  adminWorkstreams,
  cleanAdminPath,
} from "@/lib/admin-navigation";

const tabs = [
  { key: "users", label: "Users", path: "/admin/users", icon: UsersRound },
  { key: "home", label: "Home", path: "/admin", icon: House },
  {
    key: "settings",
    label: "Settings",
    path: "/admin/settings",
    icon: Settings2,
  },
] as const;

export function AdminNavigation() {
  const pathname = usePathname();
  const current = adminNavigation(pathname);
  const switcher = useRef<HTMLElement>(null);
  useEffect(() => {
    switcher.current
      ?.querySelector<HTMLElement>("[aria-current]")
      ?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [current.workstream]);

  return (
    <>
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-yellow-300 focus:p-3"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 md:px-10">
          <div className="flex min-h-16 items-center justify-between gap-4">
            <Link
              href={adminUrl("/admin")}
              aria-label="Whatelz Admin overview"
              className="flex min-h-11 items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4"
            >
              {/* Same W mark as the installed Admin app. */}
              <svg
                viewBox="0 0 512 512"
                aria-hidden="true"
                className="h-9 w-9 rounded-xl bg-[#ffe458]"
              >
                <path
                  d="m140 155 45 152 71-112 71 112 45-152"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="30"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M161 357h44m29 0h44m29 0h44"
                  stroke="currentColor"
                  strokeWidth="14"
                  strokeLinecap="round"
                />
              </svg>
              <span>
                <span className="block text-sm font-semibold tracking-tight">
                  Whatelz Admin
                </span>
                <span className="block text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                  Your command centre
                </span>
              </span>
            </Link>
            <Link
              href={adminUrl("/admin/today")}
              aria-current={
                cleanAdminPath(pathname).startsWith("/today")
                  ? "page"
                  : undefined
              }
              className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-zinc-100 px-4 text-sm font-medium transition hover:bg-yellow-100 focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <Sunrise size={17} aria-hidden="true" />
              Today
            </Link>
          </div>
          <nav
            ref={switcher}
            aria-label="Admin workstreams"
            className="-mx-4 flex snap-x gap-1 overflow-x-auto overscroll-x-contain px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0"
          >
            {adminWorkstreams.map((item) => {
              const active = current.workstream === item.label;
              return (
                <Link
                  key={item.path}
                  href={adminUrl(item.path)}
                  aria-current={active ? "location" : undefined}
                  className={`inline-flex min-h-11 shrink-0 snap-center items-center rounded-full px-4 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 ${active ? "bg-yellow-300 text-zinc-950" : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950"}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <nav
        aria-label="Admin tabs"
        className="fixed inset-x-0 bottom-0 z-40 mx-auto grid w-full max-w-lg grid-cols-3 gap-3 border-t border-zinc-200 bg-white/95 px-5 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-xl sm:rounded-t-3xl sm:border-x"
      >
        {tabs.map(({ key, label, path, icon: Icon }) => {
          const active = current.tab === key;
          return (
            <Link
              key={key}
              href={adminUrl(path)}
              aria-current={active ? "location" : undefined}
              className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 ${active ? "bg-yellow-300 text-zinc-950" : "text-zinc-500 hover:bg-zinc-100"}`}
            >
              <Icon
                size={22}
                strokeWidth={active ? 2 : 1.7}
                aria-hidden="true"
              />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
