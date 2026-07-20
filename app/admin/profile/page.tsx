import type { Metadata } from "next";
import Link from "next/link";

// Temporary landing for the MY PROFILE nav slot. Real tabbed consolidation
// (About / Projects / Career / Hackathons / Leadership / Mentorship all
// editable on one surface) ships in a follow-up sprint. For now, this page
// is a grid of links to the existing per-section admin pages so nothing
// breaks and every edit path still works.

export const metadata: Metadata = { title: "My Profile — Admin" };

const SECTIONS = [
  {
    href: "/admin/projects",
    label: "Projects",
    body: "Public-facing project cards + case studies.",
  },
  {
    href: "/admin/career",
    label: "Career",
    body: "Roles, companies, timeline.",
  },
  {
    href: "/admin/hackathons",
    label: "Hackathons",
    body: "Competitions I've entered — championship + participation.",
  },
  {
    href: "/admin/leadership",
    label: "Leadership",
    body: "Committees, clubs, and initiatives led.",
  },
  {
    href: "/admin/mentorship",
    label: "Mentorship",
    body: "Ongoing and past mentee relationships.",
  },
] as const;

export default function ProfilePage() {
  return (
    <div className="space-y-8">
      <header>
        <p className="font-mono text-xs uppercase tracking-widest text-zinc-400">
          Admin
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
          My Profile
        </h1>
        <p className="mt-3 max-w-2xl text-zinc-600">
          Content that describes me across the site. Consolidated tabbed
          editor lands in a follow-up sprint — for now, jump to each section
          below.
        </p>
      </header>

      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((s) => (
          <li key={s.href}>
            <Link
              href={s.href}
              className="group block h-full border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-900"
            >
              <p className="font-mono text-xs uppercase tracking-widest text-zinc-900">
                {s.label}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                {s.body}
              </p>
              <span
                aria-hidden
                className="mt-4 inline-block font-mono text-[10px] uppercase tracking-widest text-zinc-400 transition-colors group-hover:text-zinc-900"
              >
                Edit →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
