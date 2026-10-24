"use client";
import { useState } from "react";
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
  const [selected, setSelected] = useState(0);
  const active = groups?.[selected] ?? groups?.[0];
  function renderLink(link: {
    href: string;
    label: string;
    description: string;
  }) {
    return (
      <Link
        key={link.href}
        href={link.href.startsWith("/admin") ? adminUrl(link.href) : link.href}
        prefetch={false}
        className="admin-workspace-link"
      >
        <div>
          <span className="font-medium">{t(link.label)}</span>
          <p>{t(link.description)}</p>
        </div>
        <span aria-hidden="true">→</span>
      </Link>
    );
  }
  return (
    <div className="admin-workspace">
      <header className="admin-workspace-heading">
        <h1>{t(title)}</h1>
        <p>{t(description)}</p>
      </header>
      {intro && <div className="admin-workspace-focus">{intro}</div>}
      {links.length > 0 && (
        <div className="admin-workspace-shortcuts">{links.map(renderLink)}</div>
      )}
      {active && groups && (
        <div className="admin-workspace-directory">
          <nav
            aria-label={t("Workspace tools")}
            className="admin-workspace-index"
          >
            {groups.map((group, index) => (
              <button
                type="button"
                key={group.label}
                aria-pressed={selected === index}
                aria-controls="workspace-tools"
                onClick={() => setSelected(index)}
              >
                {t(group.label)}
              </button>
            ))}
          </nav>
          <section
            id="workspace-tools"
            aria-label={t(active.label)}
            className="admin-workspace-tools"
          >
            <h2>{t(active.label)}</h2>
            <div key={active.label}>{active.links.map(renderLink)}</div>
          </section>
        </div>
      )}
      {children}
    </div>
  );
}
