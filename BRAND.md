# BRAND.md — whatelz.ai

A reference for anyone (human or agent) writing UI for this project.

---

## Identity at a glance

**Yellow is the brand.** Not a subtle accent — the hero color. It's the first thing people remember.
`@whatelz.ai` on Instagram: yellow profile ring, yellow story highlights, yellow headlines in content cards.
Everything else is either white chrome or near-black content. Three colors, no clutter.

---

## Color system

### Core palette

| Token           | Value       | Role                                                     |
| --------------- | ----------- | -------------------------------------------------------- |
| `--background`  | `#ffffff`   | Page chrome background — always white                    |
| `--foreground`  | `#171717`   | Body text, icons, borders                                |
| `--accent`      | `#facc15`   | **THE brand color.** Yellow. Use it boldly.              |
| `--accent-text` | `#f59e0b`   | Amber — readable yellow for text-on-white contexts       |

### Zinc scale (UI chrome only)

| Use                  | Class             |
| -------------------- | ----------------- |
| Borders              | `border-zinc-200` |
| Subtle backgrounds   | `bg-zinc-50`      |
| Muted / meta text    | `text-zinc-400`   |
| Secondary body       | `text-zinc-500`   |
| Primary body         | `text-zinc-700`   |
| Headings             | `text-zinc-900`   |
| Dividers             | `divide-zinc-100` |

### Content cards (dark treatment)

Featured work, project cards, and media-forward surfaces use the **dark + yellow** treatment — not the page chrome.

```
Background:  #0a0a0a  (near-black, same as --background in legacy dark block)
Text:        #ffffff  (white)
Accent text: #facc15  (yellow — large, bold, headline-weight)
```

This is intentional. The contrast of white chrome ↔ dark cards ↔ yellow is the visual signature of the brand.

---

## The accent color rules

Yellow (`#facc15`) is used at headline weight and large size. It reads as bold, not as decoration.

**Good uses:**
- Hover fills on interactive elements: `hover:bg-[var(--accent)]`
- Category rings / highlight borders
- Large display text in cards: `style={{ color: "var(--accent)" }}`
- Active states on nav / tabs
- CTA buttons on dark backgrounds: `bg-[var(--accent)] text-zinc-900`

**Wrong uses:**
- Small body text at 12–14px (use `var(--accent-text)` / amber instead)
- Borders on light backgrounds (too bright, no contrast)
- Background on white page chrome (only on dark cards)

---

## Dark mode

**Not used in page chrome.** Do not add `dark:` Tailwind variants anywhere in the codebase.
The `globals.css` `.dark {}` block exists for legacy reasons — ignore it.

Dark backgrounds appear only inside content cards and media surfaces (intentional, not dark mode).

---

## Typography

The brand voice is **bold and editorial** — short, declarative, high-contrast. Not academic, not corporate.

| Role                   | Class                                                          |
| ---------------------- | -------------------------------------------------------------- |
| Display / hero         | `text-5xl font-black tracking-tight` (on dark cards, in yellow) |
| Page H1                | `text-2xl font-semibold tracking-tight text-zinc-900`          |
| Section heading        | `text-xl font-semibold tracking-tight text-zinc-900`           |
| Eyebrow / label        | `font-mono text-xs uppercase tracking-widest text-zinc-400`    |
| Body                   | `text-sm text-zinc-700`                                        |
| Meta / timestamp       | `text-xs text-zinc-400`                                        |
| Code / token           | `font-mono text-sm text-zinc-700`                              |

Fonts: **Geist Sans** (body, headings) · **Geist Mono** (labels, code, eyebrows)

Voice: direct, no exclamation marks, no hype words. Labels in `ALLCAPS MONO`. Body in sentence case.

---

## Components

### Buttons

```tsx
// Primary — dark fill
<button className="px-4 py-2 text-sm rounded bg-zinc-900 text-white disabled:opacity-50">

// Brand CTA — yellow (use on dark surfaces or prominent moments)
<button className="px-4 py-2 text-sm rounded bg-[var(--accent)] text-zinc-900 font-medium">

// Secondary / outline
<button className="px-4 py-2 text-sm rounded border border-zinc-300 text-zinc-700 hover:border-zinc-900">

// Ghost / muted
<button className="px-4 py-2 text-sm rounded border border-zinc-200 text-zinc-400">
```

### Cards — light (admin/utility UI)

```tsx
<div className="border border-zinc-200 rounded p-4">
```

### Cards — dark (content/feature surfaces)

```tsx
<div className="bg-[#0a0a0a] rounded-xl p-6 text-white">
  <span className="text-4xl font-black" style={{ color: "var(--accent)" }}>7 jobs</span>
  <p className="text-sm text-zinc-300 mt-2">2 countries · 3 years</p>
</div>
```

### Inputs / selects

```tsx
<input className="border border-zinc-300 rounded px-3 py-2 text-sm bg-white" />
<select className="border border-zinc-300 rounded px-3 py-2 text-sm bg-white" />
```

### Navigation (admin sidebar)

```tsx
// Active
<Link className="block px-3 py-2 rounded text-sm bg-zinc-900 text-white">
// Inactive
<Link className="block px-3 py-2 rounded text-sm text-zinc-600 hover:text-zinc-900">
```

### Accent eyebrow

```tsx
<span className="font-mono text-xs uppercase tracking-widest" style={{ color: "var(--accent-text)" }}>
  admin
</span>
```

---

## Layout

- **Page chrome:** always white background, `border-zinc-200` borders
- **Content surfaces:** near-black `#0a0a0a`, white + yellow text
- Admin: `flex min-h-screen` — `w-48` sidebar + `flex-1 p-6` main
- Max widths: `max-w-3xl` (forms/lists), `max-w-4xl` (dashboards), `max-w-5xl` (two-pane)
- Spacing: `space-y-6` between sections, `space-y-2` within lists, `gap-3` for inline controls

---

## Anti-patterns

- No `dark:` Tailwind variants anywhere
- No `bg-zinc-950` or `bg-zinc-900` on page-level wrappers (only inside content cards)
- Yellow text at small sizes — use `var(--accent-text)` (amber) instead
- Yellow borders on white backgrounds — no contrast
- Emojis in UI copy
- Exclamation marks in copy
- `min-h-screen` on page components (the layout owns it)
- More than three colors in any single view
