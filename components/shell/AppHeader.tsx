"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import { ThemeToggle } from "./ThemeToggle";

const explore = [
  ["/about", "The person", "Meet Edmund"],
  ["/projects", "The work", "Things I’m building"],
  ["/blog", "The notes", "Thinking out loud"],
  ["/this-week", "The dispatch", "Follow the journey"],
  ["/testimonials", "The people", "In their words"],
  ["/quiz", "Your starting point", "Find your archetype"],
  ["/career", "The backstory", "Experience & lessons"],
  ["/hackathons", "The experiments", "Build under pressure"],
  ["/mentorship", "The guides", "Learning from others"],
  ["/leadership", "The communities", "Growing together"],
  ["/channels", "Elsewhere", "Find your format"],
  ["/contact", "Say hello", "Start a conversation"],
];
export function AppHeader() {
  const pathname = usePathname();
  const menu = useRef<HTMLDetailsElement>(null);
  if (pathname.startsWith("/admin")) return null;
  return (
    <header className="editorial-header">
      <a className="skip-link" href="#site-content">
        Skip to content
      </a>
      <div className="header-inner">
        <Link href="/" className="wordmark" aria-label="whatelz.ai home">
          whatelz<span>↗</span>
          <small>.ai</small>
        </Link>
        <nav className="primary-nav" aria-label="Main navigation">
          <Link
            href="/about"
            aria-current={pathname === "/about" ? "page" : undefined}
          >
            My story
          </Link>
          <Link
            href="/blog"
            aria-current={pathname.startsWith("/blog") ? "page" : undefined}
          >
            Field notes
          </Link>
          <details
            ref={menu}
            className="explore-menu"
            key={pathname}
            onKeyDown={(e) => {
              if (e.key === "Escape" && menu.current) {
                menu.current.open = false;
                menu.current.querySelector("summary")?.focus();
              }
            }}
          >
            <summary>
              Explore <span aria-hidden="true">+</span>
            </summary>
            <nav className="explore-panel" aria-label="Explore the site">
              <p className="field-eyebrow">Choose your next chapter</p>
              <div>
                {explore.map(([href, label, detail]) => (
                  <Link
                    href={href}
                    key={href}
                    aria-current={
                      pathname === href || pathname.startsWith(href + "/")
                        ? "page"
                        : undefined
                    }
                    onClick={() => {
                      if (menu.current) menu.current.open = false;
                    }}
                  >
                    <span>{label}</span>
                    <small>{detail}</small>
                    <b aria-hidden="true">↗</b>
                  </Link>
                ))}
              </div>
            </nav>
          </details>
        </nav>
        <ThemeToggle />
        <Link href="/playbook" className="header-cta">
          The playbook <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </header>
  );
}
