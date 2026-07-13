"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/blog", label: "Blog" },
];

export function AppHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [pastHero, setPastHero] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";

  useEffect(() => {
    const handler = () => {
      setScrolled(window.scrollY > 10);
      setPastHero(window.scrollY > window.innerHeight * 0.6);
    };
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const hidden = isHome && !pastHero;

  return (
    <header
      className={`sticky top-0 z-40 flex h-14 items-center border-b transition-all duration-300 ${
        hidden ? "-translate-y-full opacity-0 pointer-events-none" : ""
      } ${
        scrolled
          ? "border-zinc-200 bg-white/80 backdrop-blur-md"
          : "border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 sm:px-8">
        <Link
          href="/"
          className="font-mono text-xs font-semibold uppercase tracking-widest text-zinc-900 transition-opacity hover:opacity-60"
        >
          WHATELZ.AI
        </Link>

        <nav className="flex items-center gap-6" aria-label="Main navigation">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`font-mono text-[10px] uppercase tracking-widest transition-colors hover:text-zinc-900 ${
                pathname.startsWith(href) ? "text-zinc-900" : "text-zinc-400"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
