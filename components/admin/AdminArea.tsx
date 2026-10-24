"use client";
import { useAdminPreferences } from "./AdminPreferences";
import Link from "@/components/admin/AdminLink";
import { adminUrl } from "@/lib/admin-url";

export function AdminArea({
  title,
  description,
  links,
  children,
  intro,
  groups,
}: {
  title: string;
  description: string;
  links: readonly { href: string; label: string; description: string }[];
  children?: React.ReactNode;
  intro?: React.ReactNode;
  groups?: readonly {
    label: string;
    links: readonly { href: string; label: string; description: string }[];
  }[];
}) {
  const { t } = useAdminPreferences();
  return (
    <div className="space-y-8">
      <header className="border-b border-zinc-200 pb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          {t(title)}
        </h1>
        <p className="mt-3 max-w-2xl text-zinc-600">{t(description)}</p>
      </header>
      {intro}
      {links.length > 0 && (
        <div className="admin-area-links divide-y divide-zinc-200 border-y border-zinc-200">
          {links.map((link) => (
            <Link
              key={link.href}
              href={
                link.href.startsWith("/admin") ? adminUrl(link.href) : link.href
              }
              prefetch={false}
              className="group flex min-h-20 items-center justify-between gap-4 py-4 focus-visible:outline-2 focus-visible:outline-yellow-400"
            >
              <div>
                <h2 className="text-base font-medium">{t(link.label)}</h2>
                <p className="mt-1 text-sm text-zinc-500">
                  {t(link.description)}
                </p>
              </div>
              <span aria-hidden="true" className="text-zinc-400">
                ↗
              </span>
            </Link>
          ))}
        </div>
      )}
      {groups && (
        <div className="admin-tool-groups divide-y divide-zinc-200 border-y border-zinc-200">
          {groups.map((group) => (
            <details key={group.label} className="py-3">
              <summary className="min-h-11 cursor-pointer py-2 text-sm font-medium">
                {t(group.label)}
              </summary>
              <div className="pb-3 pl-4">
                {group.links.map((link) => (
                  <Link
                    key={link.href}
                    href={
                      link.href.startsWith("/admin")
                        ? adminUrl(link.href)
                        : link.href
                    }
                    prefetch={false}
                    className="block min-h-11 py-3 text-sm"
                  >
                    <span className="font-medium">{t(link.label)} →</span>
                    <p className="mt-1 text-xs leading-5 text-zinc-500">
                      {t(link.description)}
                    </p>
                  </Link>
                ))}
              </div>
            </details>
          ))}
        </div>
      )}
      {children}
    </div>
  );
}
