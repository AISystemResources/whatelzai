"use client";

import { type ReactNode } from "react";
import { FieldHero } from "@/components/editorial/FieldElements";
const TITLES: Record<string, string> = {
  Projects: "Ideas with their sleeves rolled up.",
  Channels: "Same curiosity. Different corners.",
  Career: "Every chapter brought me here.",
  Hackathons: "A little pressure. A lot of possibility.",
  Mentorship: "Nobody grows entirely alone.",
  Leadership: "Build something bigger than yourself.",
  Contact: "Good things start with hello.",
};
const NUMBERS: Record<string, string> = {
  Projects: "03",
  Channels: "07",
  Career: "08",
  Hackathons: "09",
  Mentorship: "10",
  Leadership: "11",
  Contact: "12",
};

interface Props {
  title: string;
  description?: string;
  /** Rendered right-aligned in the subheader (e.g. view toggle) */
  actions?: ReactNode;
  children: ReactNode;
  maxWidth?: string;
}

export function PageShell({
  title,
  description,
  actions,
  children,
  maxWidth = "max-w-5xl",
}: Props) {
  return (
    <main className="collection-page">
      <FieldHero
        label={title}
        title={TITLES[title] ?? title}
        description={description}
        number={NUMBERS[title] ?? "01"}
      />
      <div className={`collection-body mx-auto w-full ${maxWidth} px-6 py-12`}>
        {actions && <div className="collection-actions">{actions}</div>}
        {children}
      </div>
    </main>
  );
}

/** Reusable table/card view toggle, for use in PageShell actions */
export function ViewToggle({
  view,
  onChange,
}: {
  view: "table" | "card";
  onChange: (v: "table" | "card") => void;
}) {
  return (
    <div className="flex border border-zinc-200 rounded overflow-hidden">
      {(["table", "card"] as const).map((v) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          aria-pressed={view === v}
          className={`px-4 py-1.5 font-mono text-xs uppercase tracking-widest transition-colors ${
            view === v
              ? "bg-zinc-900 text-white"
              : "text-zinc-500 hover:text-zinc-900"
          }`}
        >
          {v}
        </button>
      ))}
    </div>
  );
}
