<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

---

# CLAUDE.md — whatelz.ai

Instructions for any AI coding agent (Claude Code, Cursor, Aider, ...) working on this repo.

## Source of truth — two layers, kept in sync

| Layer                                                                            | What it holds                            | Where it lives |
| -------------------------------------------------------------------------------- | ---------------------------------------- | -------------- |
| **Process** — agent protocols, sprint workflow, doc registry, writing discipline | EMDEE vault under `projects/WHATELZ-AI/` |
| **Code behaviour** — stack, commands, structure, what runs where                 | This repo                                |
| **Bridge** — repo specifics + pointers into EMDEE for process                    | This file                                |

**Rule:** this file never duplicates EMDEE protocol — it references it. Code-side mirror of `projects/WHATELZ-AI/INSTRUCTIONS.md`. When repo behaviour changes, update both in the same commit.

## What this is

`whatelz.ai` — Edmund Lin Zhenming's personal AI-engineer site. Data-driven content (projects, channels, hackathons, blog, career, leadership, mentorship, testimonials) backed by Supabase, with a gated admin shell and an MCP surface for Claude clients. Full product truth: `projects/WHATELZ-AI/CONTEXT.md`.

## Stack

- **Framework:** Next.js 16.2.4 (App Router), React 19.2.4, TypeScript 5 (strict)
- **Styling:** Tailwind CSS v4 (`@tailwindcss/postcss`) — _light mode only, see Hard Rule 5_
- **Auth:** Clerk (`@clerk/nextjs`)
- **Data:** Supabase (Postgres) — `@supabase/supabase-js`
- **Jobs:** none. Background/cron work is not supported in-repo — schedule remote agents via claude.ai if needed.
- **AI runtime:** none. Zero server-side inference — not Anthropic, not Groq, not any Vercel AI SDK provider. All LLM reasoning happens client-side in Claude Chat / Claude Code, hitting the MCP surface at `/api/mcp/whatelz` (or the future CLI). MCP verbs are pure data — read verbs return structured context, write verbs persist a body Claude produced client-side.
- **PDF:** Puppeteer (`puppeteer-core` + `@sparticuz/chromium-min`) — resume renderer
- **Email:** Resend
- **Package manager:** npm (lockfile: `package-lock.json`)

Dev port is **3100**, not 3000 (`npm run dev` → `next dev -p 3100`). Single Vercel project, single production branch (`main` → `whatelz.ai`).

## Commands

| Purpose                 | Command                                                                                                                                                                                       |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dev server              | `npm run dev` (http://localhost:3100)                                                                                                                                                         |
| Production build        | `npm run build`                                                                                                                                                                               |
| Start built app         | `npm run start`                                                                                                                                                                               |
| Lint                    | `npm run lint` (eslint)                                                                                                                                                                       |
| Format (write)          | `npm run format`                                                                                                                                                                              |
| Format check            | `npm run format:check`                                                                                                                                                                        |
| Typecheck               | `npx tsc --noEmit` <!-- TODO: no `typecheck` script in package.json — convention is bare `npx tsc --noEmit`. Consider adding `"typecheck": "tsc --noEmit"` for autonomous-run uniformity. --> |
| Seed website docs       | `npm run seed`                                                                                                                                                                                |
| Migrate sqlite→Supabase | `npm run migrate:sqlite` (one-shot historical)                                                                                                                                                |

<!-- TODO (critical for autonomous runs): no test runner is configured. No vitest, jest, or Playwright. No `__tests__/` or `e2e/` directories. Acceptance criteria in sprint specs cannot rely on `npm run test` until a test stack lands. -->

## 🚨 HARD RULES

Guardrails an autonomous agent must never break. Each is grounded in repo state or EMDEE/memory — not invented.

### 1. Deploy ceiling — `feat/*` model, infra-enforced

The standardized model (identical across all four EMDEE-tracked repos):

- **`main`** is production (`whatelz.ai`). PR-protected, human-merge only. Direct pushes are rejected by GitHub at the wire (`GH006 protected branch hook declined`, `enforce_admins: true`).
- **`feat/<sprint-id>-<slug>`** — one branch per sprint, branched from `main`, merged back via PR. Multiple may exist concurrently — that is the parallelism.
- **No long-lived `agents` branch.** Each sprint gets its own feat branch.
- **Previews:** `feat/*` branches auto-deploy as Vercel **Preview** (not Production). The preview URL is `https://whatelz-git-<branch-slug>-elzmings-projects.vercel.app`. Use it for visual QA before merging.

Verified 2026-05-28 by pushing `feat/zzz-ceiling-test`: Vercel created a Preview deploy with `target: null`; the prior direct push to `main` was rejected with `GH006`.

### 2. Never commit secrets

`.env*` (except `.env.example`) is git-ignored. Real values live in Vercel project env vars. Secrets to never appear in commits, even in tests or fixtures:

- `CLERK_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY` (the anon key is public-safe but treat the file as a unit)
- `MCP_TOKEN` (PAT wrapped by the project's OAuth flow at `/api/mcp`)
- `RESEND_API_KEY`

Full list: `.env.example`. Generate with `openssl rand -hex 32` where the comment says so.

### 3. Migration discipline — apply, don't hand off

When proposing a new `supabase/migrations/*.sql`, **apply it immediately** in the same session via Supabase Studio or CLI. Do not hand off "user, please apply this." The Supabase MCP in `.mcp.json` is currently **read-only** (no write tool exposed), so application happens via Studio/CLI for now. Re-enable write access by removing `--read-only` from the Supabase MCP config when ready.

### 4. No server-side LLM. Ever.

- **Zero server inference.** Not Anthropic, not Groq, not OpenAI, not any Vercel AI SDK provider. All LLM reasoning happens client-side in Claude Chat / Claude Code, invoked by Edmund, hitting the MCP at `/api/mcp/whatelz` (or the future CLI) for data.
- **MCP verbs are pure data.** Read verbs return raw or lightly-shaped structured context. Write verbs persist a body that arrives fully-formed from the client. If a tool feels like it needs server inference to be useful, split it into a read verb + a write verb and let Claude bridge them client-side.
- **Do not suggest** `ANTHROPIC_API_KEY`, `GROQ_API_KEY`, `OPENAI_API_KEY`, or any similar env var as a pending action, prerequisite, or blocker.

### 5. Light mode only

`whatelz.ai` is permanently light mode. **Never:**

- Add `dark:` Tailwind variants to new components.
- Wire `ThemeProvider` from `next-themes` (the dep is vestigial, see Stack).
- Read `prefers-color-scheme` in app code.

If you find existing `dark:` classes during a refactor, leave them — removal is its own sprint, not a drive-by.

### 6. Stay in your assigned module + lane

EMDEE INSTRUCTIONS (`projects/WHATELZ-AI/INSTRUCTIONS.md`) defines two agent lanes:

- **Claude Chat** writes CONTEXT / INSTRUCTIONS / IDEAS / BUILD specs. Never writes BUILD close-outs.
- **Claude Code** flips sprint `queued → in-progress` _before_ writing code; appends close-out to the same sprint section on ship; flips to `blocked` if stuck.

Do not write to docs you don't own (BRAND, LOGS, LEARNINGS — see Doc Registry). Do not promote IDEAS or INBOX entries on your own; humans commit.

### 7. No destructive DB ops without sign-off

Never run `DROP TABLE`, `TRUNCATE`, `DELETE` without `WHERE`, or migrations that drop columns with data, unless Edmund has approved (chat or sprint spec) and a backup/down-migration exists. Supabase Studio actions are irreversible against the remote project.

### 8. Always commit and push together

After completing work, push to `origin` immediately — Vercel deploys on push to `main`, and a half-committed local state hides shippable code from review. Memory rule, post-multiple-times-burned.

### 9. Never bypass hooks or signing

No `--no-verify`, no `--no-gpg-sign` unless explicitly instructed. If a pre-commit hook fails, fix the underlying issue and create a new commit — do not amend the failed one.

### 10. Worktree-per-agent

Two `worktree-agent-*` branches exist locally — the pattern is active. Concurrent agents (or agent + human) use separate worktrees. Coordinate via the `In-Flight Thinking` block in EMDEE BUILD before deep work (see EMDEE INSTRUCTIONS → Agent Protocols).

## Branch & commit conventions

- **Production:** `main` → `whatelz.ai` via Vercel auto-deploy on push. Protected: PR required, force-push disabled, deletion disabled, admin enforcement on.
- **Feature branches:** `feat/<sprint-id>-<slug>` (e.g. `feat/062-resume-bugfixes`). Branched from `main`, merged back to `main` via PR. Each gets its own Vercel Preview URL.
- **No long-lived non-main branches.** No `dev`, no `uat`, no `agents`, no `worktree-agent-*`. If you see one, it's stale — flag it.
- **Commit messages:** conventional + scope. Recent examples: `feat(admin/resume): ...`, `fix(admin/resume): ...`, `chore: ...`. Two-line minimum: short subject, blank, prose paragraph explaining _why_. Co-author trailer for Claude-Code-driven commits.
- **Push discipline:** Hard Rule 8 — commit + push in the same step. For agent work that's a `git push -u origin feat/...` then `gh pr create`.

## Sprint workflow — POINT, don't duplicate

Full process lives in EMDEE under `projects/WHATELZ-AI/`. Cite, don't restate:

- **Active sprint index:** `projects/WHATELZ-AI/SPRINTS.md` — Active / Queued / Blocked / Recently shipped / Ops Checklist. Shipped sprint bodies live under `logs/` and are indexed by `projects/WHATELZ-AI/LOGS.md`.
- **Per-sprint specs + close-outs:** `projects/WHATELZ-AI/sprints/SPRINT-NNN.md`. One file per sprint, monotonic numbering. Status: `queued | in-progress | blocked | shipped`. Type: `dev | ops`. Category: `feature | infra | fix | content | chore`. Owner: `chat | code`.
- **Standing rules:** `projects/WHATELZ-AI/INSTRUCTIONS.md` — session start protocol, agent lanes, doc registry, BUILD structure, writing discipline.
- **Product truth:** `projects/WHATELZ-AI/CONTEXT.md`.
- **Durable lessons:** `projects/WHATELZ-AI/learnings/*.md` (18 LEARNINGS extracted to date).

**Session-start reading order** (Claude Code, every session):

1. `projects/WHATELZ-AI/INSTRUCTIONS.md`
2. `projects/WHATELZ-AI/SPRINTS.md` (Active + Queued)
3. Target sprint file under `projects/WHATELZ-AI/sprints/` (active) or `logs/` (shipped, for context)

Most recent shipped (2026-07-13): SPRINT-073 (landing polish + SEO/GEO push — dynamic sitemap, `/llms.txt`, per-page JSON-LD, `/about`, `/api/og`). Current work: landing search-bar hero + brand-search-results signature moment (this branch: `feat/073-landing-polish`).

## Autonomous agent / Ralph protocol

Rules for unattended runs (overnight, batch, long-running). Tighter than interactive sessions, not looser.

### Preconditions — refuse to start without

1. **A written spec** at `projects/WHATELZ-AI/sprints/SPRINT-NNN.md` with `Status: queued`.
2. **Explicit, testable acceptance criteria** in the spec. Since there is no test runner (see Commands TODO), "testable" here means _manually verifiable_ — the spec must list the commands or visual checks that prove acceptance.
3. **A single named module** in scope. Cross-module sprints need human chunking first.
4. **Target branch declared** in the spec: always `feat/<sprint-id>-<slug>`, branched from `main`. Never `main` directly (Hard Rule 1 blocks this at the wire).
5. **Migration plan** if `supabase/migrations/` is touched: which migration is added, applied how (Studio/CLI), rollback noted.

If any precondition fails → write `Status: blocked` to the sprint with what's missing, and stop. Do not improvise the spec.

### Definition of done

All must be green before declaring the sprint shipped:

1. `npm run build` — clean.
2. `npx tsc --noEmit` — zero errors in touched files. (Pre-existing errors elsewhere don't count but shouldn't get worse.)
3. `npm run lint` — clean.
4. `npm run format:check` — clean (or `npm run format` run + diff reviewed).
5. **Manual verification step** from the spec executed and noted in the close-out (since there is no automated test suite).
6. Migration applied (if touched) — confirm via Supabase Studio query or schema diff.
7. **No out-of-scope files modified.** `git diff --name-only main` should match the sprint's deliverables.
8. **Close-out written** under the sprint's Close-out heading: what landed, verification commands run + results, follow-ups carried out.
9. **Committed and pushed** to the agent-allowed branch (Hard Rule 8 + Hard Rule 1).
10. **BUILD index updated:** sprint moved out of Active/Queued into Recently shipped.

### Safety rails

- **Max iterations:** every autonomous run sets `--max-iterations` (or equivalent) up-front. No infinite loops.
- **Thrash bail:** if the same error or build failure repeats twice without progress, stop and flag. Don't iterate to mask.
- **Hard-rule collision:** if any Hard Rule above would be violated to finish the work, stop. Surface the conflict — don't bypass.
- **No silent dependency changes.** Adding a new top-level dep needs an Edmund-visible note in the close-out. Removing one (e.g. `next-themes`, `@react-pdf/renderer`) is its own sprint.
- **No production env-var changes.** Surface as a follow-up for Edmund to set in Vercel.

### Flagging — where unattended blockers go

When stopping mid-run, write a single status patch:

- **Primary:** the sprint file's `Status:` → `blocked`, plus a new subsection:

  ```
  ### Blocker (YYYY-MM-DD)
  **Attempted:** <what>
  **Blocking:** <why>
  **Would unblock:** <specifically what unblocks>
  **Branch + commit:** <branch>@<sha>
  ```

- **Secondary** (cross-cutting): append to `projects/WHATELZ-AI/SPRINTS.md` → Ops Checklist with the same shape.
- **Silent failure is worse than loud.** Always write something before exiting.

## Directory map (top levels)

```
.
├── app/                       # Next.js App Router
│   ├── admin/                 # Gated admin shell (Clerk-protected)
│   ├── api/                   # API routes (REST + MCP at /api/mcp[/...])
│   ├── blog/, projects/, channels/, hackathons/, leadership/, mentorship/, services/, career/, contact/
│   ├── layout.tsx, page.tsx, globals.css, not-found.tsx, sitemap.ts
├── components/
│   ├── admin/                 # Admin-only UI
│   ├── sections/              # Page sections (data-section scroll-spy targets)
│   ├── shell/                 # Push drawers, NavRegistry, AdminNavInjector
│   └── ui/                    # Primitives
├── lib/                       # Data access + helpers
│   ├── mcp-discovery.ts                       # MCP tool surface
│   ├── supabase-client.ts, supabase-server.ts
│   ├── projects.ts, channels.ts, blog.ts, career.ts, hackathons.ts, leadership.ts, mentorship.ts
│   ├── resume-versions.ts
│   ├── media.ts, website-docs.ts, rate-limit.ts, pill-access.ts, module-nav.ts, navigation-map.ts, utils.ts
│   └── shell/                 # Shell-architecture pieces
├── supabase/
│   ├── config.toml
│   └── migrations/            # Apply immediately on propose — Hard Rule 3
├── scripts/                   # seed-website-docs, migrate-sqlite-to-supabase, ...
├── proxy.ts                   # Root-level proxy entry
├── .mcp.json                  # Local MCP servers (Supabase only — read-only)
└── (no .github/workflows/ — no CI in-repo; Vercel build is the only gate)
```

## Definition of done — every change, human or agent

Before declaring any work shipped (sprint-sized or one-off fix):

- [ ] `npm run build` and `npx tsc --noEmit` pass (touched files).
- [ ] `npm run lint` passes.
- [ ] `npm run format:check` passes (or format run + reviewed).
- [ ] Manual verification step (from sprint spec or task) executed and noted.
- [ ] If `supabase/migrations/` touched: migration applied and confirmed (Studio query / schema diff).
- [ ] No secrets in commit; no `.env*` (except `.env.example`) staged; no new `ANTHROPIC_API_KEY` dependency.
- [ ] Commit message follows conventional prefix + scope + why-paragraph + Co-Authored-By trailer.
- [ ] Commit **and push** together (Hard Rule 8). Vercel will deploy on `main` push.
- [ ] EMDEE SPRINTS updated: sprint Close-out written; index moved Active/Queued → Recently shipped (and body relocated from `sprints/` → `logs/`); Ops Checklist updated if cross-cutting follow-ups remain.
- [ ] If the change touches code behaviour referenced in this file or EMDEE INSTRUCTIONS — both updated in the same commit.
