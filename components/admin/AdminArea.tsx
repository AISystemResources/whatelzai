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
}: {
  title: string;
  description: string;
  links: readonly { href: string; label: string; description: string }[];
  children?: React.ReactNode;
  intro?: React.ReactNode;
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
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={
                link.href.startsWith("/admin") ? adminUrl(link.href) : link.href
              }
              prefetch={false}
              className="rounded-xl border border-zinc-200 p-5 transition-colors hover:border-zinc-400 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-zinc-900"
            >
              <h2 className="font-semibold text-zinc-900">{t(link.label)} →</h2>
              <p className="mt-2 text-sm text-zinc-600">
                {t(link.description)}
              </p>
            </Link>
          ))}
        </div>
      )}
      {children}
    </div>
  );
}
