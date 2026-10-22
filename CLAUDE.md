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
- **Auth:** Supabase Auth (Google OAuth, `@supabase/ssr`)
- **Data:** Supabase (Postgres) — `@supabase/supabase-js`
- **Jobs:** none. Background/cron work is not supported in-repo — schedule remote agents via claude.ai if needed.
- **AI runtime:** Personal admin uses ChatGPT/Codex and pure-data MCP. Explicitly authorized member API inference runs only on app.whatelz.ai behind MEMBER_AI_ENABLED; see docs/member-assistant.md. Personal API Daily stays off.
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

### 4. Personal admin uses subscription/MCP; member API is explicitly scoped

- Personal admin reasoning stays in ChatGPT/Codex with pure-data MCP. Edmund explicitly authorized server-side OpenAI member inference on app.whatelz.ai (SPR-129), with US$5/person/month, atomic reservations, owner-managed access and resets. This supersedes the former blanket no-inference rule only for member chat.
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

### Playbook draft preview (SPR-114, 2026-09-19)

`/playbook` is an ungated 3D reader of a reviewed, versioned EMDEE chapter snapshot in `content/playbook/chapters.json`. This follows Edmund's request to build the reading experience before adding payment gating. No live vault credentials or requests are used. Editorial placeholders are excluded and the UI labels the content as a work in progress. Import instructions and provenance are in `content/playbook/README.md` and `source-manifest.json`.

The earlier sales page is retained in `app/playbook/_components/storefront.tsx`; checkout, account, and protected chapter routes are unchanged. Future paid access must gate chapter data on the server before it reaches the client. `node --import tsx --test scripts/playbook-pagination.test.ts` verifies the snapshot boundary and lossless pagination.

### Files

```
.
├── app/                       # Next.js App Router
│   ├── admin/                 # Gated admin shell (Supabase-protected)
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

## Editorial public site (SPR-115)

The public brand is the solopreneur’s playbook: **Money Mindset × AI Skillset**. The primary journey is `/playbook`, then following Edmund’s ongoing journey through `/this-week`, `/blog`, and `/projects`. Write in a personal, practising-in-public voice; do not imply already-achieved financial outcomes.

`app/editorial.css` defines the editorial layout; `app/themes.css` defines the signature #FACC15 yellow, light paper and dark charcoal palettes. Edmund explicitly requested light/dark modes on 2026-09-19, superseding the earlier light-only constraint. `components/editorial/FieldElements.tsx` owns reusable chapter heroes, the CSS book object and onward links; `Pillars.tsx` owns the interactive two-pillar spread. Public collection pages use `PageShell`; public detail pages opt into `editorial-reading`. The header Explore menu exposes the full public route catalogue on desktop and mobile. Keep the existing product reader’s pagination, touch/trackpad gestures and accessibility intact. Native cursor, visible keyboard focus and reduced-motion support are intentional. Admin navigation remains separate.

## Taste refinement (SPR-116)

The Taste audit and contextual brand exceptions are recorded in `docs/design/taste-audit.md`. Shared collection headers omit decorative numbering. The homepage uses `MotionDetails` for restrained book tilt and section movement, `ArticleSelection` for a featured article and supporting list, and `ReaderVoices` for manual testimonial excerpts. Preserve full source quotes and real publication dates. Motion respects reduced-motion preferences; touch readers retain a static book cover. The shared shell no longer repeats an onward-link block before the footer. Generated conceptual artwork is documented in the audit and must not be presented as Edmund’s actual desk or a physical product.

Theme preference follows the OS until explicitly toggled, then persists under `whatelz-theme-v1`. The root prepaint script and `ThemeToggle` must use the same key and accepted values. Preserve keyboard labels, reduced-motion support, and readable reader pages in both modes. Public legacy utility overrides are scoped to `.public-site`; the admin surface remains isolated.

## Subdomain surfaces

One Vercel project serves whatelz.ai (public), admin.whatelz.ai (admin), and app.whatelz.ai (members). `proxy.ts` refreshes and verifies Supabase cookie sessions before protected rewrites, forwards refreshed cookies and private cache headers, and checks stored roles on admin mutations. Legacy production `/admin/*` links redirect to the admin host. Local/preview `/admin` routes remain available. `/auth/*`, `/sign-in`, `/sign-up`, APIs and Next assets retain their paths. Clean admin links use `adminUrl`.

Google OAuth uses server-side PKCE through `/auth/google` and `/auth/callback`; redirect destinations are constrained to the current origin or the four production origins. Auth cookies share `.whatelz.ai` on the four known production hosts and stay host-only for local/preview hosts. Sign-out revokes the Supabase session. Google must be enabled in Supabase with its OAuth client credentials and callback allowlist; see `docs/supabase-google-setup.md`. Signed-in responses are never publicly cached. Admin layouts, API wrappers and Server Actions independently check `users.role`; user-editable auth metadata never determines permissions.

Stable `users.id` is the application identity; `supabase_auth_user_id` maps verified sessions to it. Sign-in never matches by email, grants admin roles or claims team nodes. New accounts retain the unauthorized default role. Historical Clerk IDs/columns remain solely for migration and old Stripe events; the Clerk SDK and login components are removed. Existing verified accounts require explicit provisioning/linking before cutover. Purchases, subscriptions and quiz history use separate internal owner columns, preserving the legacy columns during migration. No production cutover until Google setup, identity preservation and migration approval are complete.

Validation: `node --import tsx --test scripts/domain-routing.test.ts scripts/team-model.test.ts scripts/auth-routing.test.ts`, typecheck, changed-file lint, build, isolated migration tests and anonymous protected-route checks.

## Team relationships

Teams group sponsor trees. People have independent IDs and one optional direct sponsor in their team; PostgreSQL rejects self links, cycles and identity/team changes. Repeated names are allowed. Verified login accounts are linked explicitly to people. Admins see the full tree; members see their direct upline and downline branch; managers see their team. Filtering occurs on the server before serialization. Context notes are manager/admin-only; contact emails are admin-only. Team visibility never changes global roles.

Team screens offer Tree view and Node view with sponsor connectors, scroll, zoom, fit and reset. Admins/managers can select a reference person. Admins can edit optional contact emails and ABO numbers; ABO numbers are text to preserve leading zeros and appear in permitted views. Saving an email never claims an account or sends an invitation. Real names, email addresses, ABO numbers and sponsor placements must stay in Supabase or ignored `supabase/private/` data, never the public repository.

The team contact-details migration is applied. The Supabase identity migration was applied through the linked CLI on October 7, 2026 after explicit owner approval. The verified legacy account retains its internal ID, role and quiz ownership; Google sign-in and logout are verified on the PR preview. EMDEE behavior documentation requires a writable connection; do not claim it is updated until a write succeeds.

## Member product references (SPR-117)

The signed-in `app.whatelz.ai/catalogue` provides MY/SG product references, market switching, SKU/name search, category/brand filters, AP/RP and published PV/BV. It has no checkout. Member home and admin Network Marketing link to it. Source snapshots retain dates, checksums, page numbers and raw numeric cells; ambiguous rows remain excluded in review queues. Never derive PV/BV from prices, tax or exchange rates. The product_catalogue tables have RLS and no anon/authenticated grants; server reads require a verified application user. Evidence and refresh procedure: `docs/network-marketing/product-reference.md`. Mirrored in EMDEE INSTRUCTIONS under “Member product references (SPR-117)”.

## Community calendar (SPR-118)

The signed-in `app.whatelz.ai/calendar` is an imported Founder’s Club schedule with month/agenda views and activity/search filters. Preserve recurring schedules, exception dates, UTC+8, update sequence and cancellations using pinned ical.js 2.2.1. Import only allowlisted schedule fields; never share attendees, RSVP tokens or meeting credentials. Private tables have RLS/no anon/authenticated grants; page and loader require verified users independently. No RSVP or live sync. Source exports stay under ignored `supabase/private/`. Procedure: `docs/network-marketing/community-calendar.md`. Mirrored in EMDEE INSTRUCTIONS under “Community calendar (SPR-118)”.

## Calendar personas and date states (SPR-119)

Today uses Malaysia/Singapore UTC+8 and refreshes while open; past days are grey and ended events are reference-only. Oracle is Dick Lim alone; Catalyst has ABO + club membership; Spark has club membership without ABO; Guests attend by Catalyst invitation. Calendar persona assignments are explicit and admin-only at `/admin/calendar-access`, separate from application admin roles and team links. Unassigned accounts are Guests. The server filters occurrences before serialization; query-string persona previews only work for admins. Badminton/Captain Ball allow Spark and invited Guests; Monday/Wednesday classes, HQ tour/HQH and Intro/Gather/Collab allow Catalyst. Other audiences await confirmation and remain founder/admin review only. No automatic membership inference or invitation/RSVP creation. One Oracle account, explicit founder confirmation on assignment. Mirrored to EMDEE INSTRUCTIONS under this heading.

## Member Culture library (SPR-120)

The signed-in `/culture` reader exposes 超凡 / Ultra’s 15-chapter collection, Chinese search and chapter filtering. A versioned editorial snapshot preserves all 233 user-provided source occurrences as 231 distinct exact-text sayings. Source attribution is Edmund-provided; original wording and possible transcription errors remain unchanged. 顺育 / Soon Ye and Founder’s Club are empty collections. Shared member navigation links Culture from home, team, catalogue and calendar. No database migration, membership changes, runtime inference or generated interpretations. Source and refresh notes: `content/culture/README.md`. Mirrored to EMDEE INSTRUCTIONS under this heading.

## Member Leads system (SPR-121)

The signed-in `/leads` workspace is owner-private. Each lead has an independent ID, FC Central/Northern/Southern region, optional Guest/Spark status, ABO/APC goal, pipeline stage, personal story, relationship background, interests, concerns, sales notes and dated follow-up. Optional contact/birthday/zodiac fields are never inferred. Activities distinguish attended, planned and to-invite; manual history never creates RSVP or calendar bookings. Membership/status fields never grant access or create accounts/team links. Every loader and action independently verifies the application user and scopes all queries to stable users.id. Tables have RLS with no anon/authenticated grants; service-side access only. Composite ownership foreign keys and revision checks protect activities and concurrent updates. List queries are bounded and paginated. Real names, contacts and private stories stay in Supabase/ignored private files, never committed seeds or test fixtures. Initial profiles remain private; future team sharing needs explicit permissions.

EMDEE INSTRUCTIONS mirrors this section. The CLI token was rejected during release; the connected EMDEE MCP completed the version-guarded mirror successfully.

## Admin team profiles (SPR-122)

The admin `/team` surface defaults to a fitted fixed node canvas. Member edit forms and verified-account linking are collapsed initially. First activation opens one compact selected-person editor; a second activation of that same person (including double click/tap or repeated keyboard activation) navigates to `/team/[id]`. A visible Open profile link provides an explicit alternative, and Close clears the selection. Tree view uses the same interaction. Dedicated profiles show editable details plus direct upline/downline links. Existing verified-admin checks remain in pages, loaders and mutations; contact email/progress notes remain admin-only and no account grants are inferred. Member app interactions remain unchanged. Pan/pinch/drag click suppression remains intact; admin quick editing does not change graph dimensions. Mirrored to EMDEE INSTRUCTIONS under this heading.

## Sole owner administration (SPR-125)

Edmund owns Whatelzai permanently. The whole admin.whatelz.ai surface is private to his stable application users.id, configured server-side as WHATELZ_OWNER_USER_ID. lib/admin-policy.ts requires both this exact ID and a stored privileged role; role labels alone never grant administration. Missing/invalid owner configuration fails closed. Proxy gates admin page reads/writes and /api/admin on every host; layouts, actions, session API wrappers, OAuth issuance/redemption and active MCP token checks independently enforce the same policy. Owner-authorized scoped agent tokens remain supported; tokens bound to other accounts are rejected. Shared app.whatelz.ai membership and team permissions remain separate; privileged global team/calendar overrides are owner-only. Do not derive ownership from email, JWT/user metadata, login order, number of admins or automatic promotion.

Product metrics are independent authenticated connections into this personal command centre. Access to a sold/transferred product must be revoked at the source and its integration credentials removed here; ownership of Whatelzai grants no ongoing rights to another product. No cross-product database ownership assumptions. See docs/owner-admin.md for configuration and verification. — codex, 2026-10-19

## Daily workspace and admin navigation (SPR-124)

Admin `/` is Overview. `/command-center` redirects home; the former root website dashboard is `/site-dashboard` under AI Business. `Today` is `/today` with owner-only morning/evening editors, explicit operational commitments and connections. Canonical Markdown stays in EMDEE; SQL holds operational records and encrypted connection credentials only. Use the shared sole-owner policy, never a second productivity-only owner setting. Read docs/daily/README.md for OAuth, encryption, task lifecycle, source boundaries and run limits. Manual workflow only; no 8am/9pm schedules are enabled and existing ChatGPT schedules are unchanged. — codex, 2026-10-19

## Personal Daily and weekly reflection (SPR-126)

Canonical briefs live in EMDEE Personal `01-DAILY` (the first Personal branch), with `01-MORNING`, `02-EVENING`
and `03-WEEKS` children. Reauthorize the folder in Connections; old project-scoped
tokens cannot save new briefs. Vercel runs one combined prior Monday–Sunday
reflection every Monday at 08:00 Singapore. Originals remain intact; summaries
include source links/hashes and missing coverage. `/today/weekly` shows status and
bounded manual retry. The cron endpoint requires CRON_SECRET, production and the
configured owner's stored role; admin session policy remains intact. SQL stores
only execution metadata, never Markdown. See docs/daily/README.md. This explicitly
requested schedule supersedes the old blanket prohibition on in-repo jobs; daily
08:00/21:00 generation is still disabled. — codex, 2026-10-19


## Subscription-first personal Daily (SPR-127)

Personal Daily uses the existing ChatGPT cloud tasks at 04:30 and 21:00
Asia/Singapore. They read/write canonical EMDEE Morning/Evening records and verify
readback; Whatelzai loads the saved Notes when Today opens or refreshes. Progress
is never inferred as completed, and saving a brief never accepts commitments.
Both Run now tests saved records that production Today successfully displayed.
This verifies the tested execution path, not future unattended runs.

API generation defaults off unless DAILY_API_GENERATION_ENABLED is exactly true.
Daily actions, the shared generation module and weekly cron fail closed before
inference; the weekly job returns disabled before reserving attempts. Credentials
remain encrypted for eventual opt-in use. Monday API synthesis is paused; no
ChatGPT weekly replacement is configured. This supersedes earlier descriptions
of enabled weekly API generation and unchanged daily ChatGPT instructions.

OAuth setup must verify the selected EMDEE parent with the new credential before
storing it; a valid token for the wrong account must not count as a successful
connection. Never copy a personal CLI/chat token into application configuration.
See docs/daily/README.md. — codex, 2026-10-19


## ChatGPT weekly reflection (SPR-128)

The personal cloud task Weekly - EMDEE Reflection runs Mondays at 03:00
Asia/Singapore (first natural run 2026-10-26), superseding the previous paused
weekly plan. It reads the prior complete Monday–Sunday, saves one combined
WEEK-YYYY-Www child under EMDEE Daily/Weeks, verifies readback and retains
originals. Coverage and missing entries remain explicit; unavailable sources fail
closed and unknown outcomes stay unknown. API generation remains off.
The weekly page discovers the canonical EMDEE document independently of SQL
API-run status so externally written summaries display correctly. Existing API
metadata remains separate; the old daily 03:00 Distill is unchanged.
See docs/daily/README.md. — codex, 2026-10-19


## Member assistant (SPR-129)

See docs/member-assistant.md for stable ownership, verified 1:1 EMDEE OAuth
linking, mobile chat, private commitment tools and bounded API execution.
MEMBER_AI_ENABLED is independent of the personal Daily generation flag.
Admin /users is sole-owner gated; reset grants a fresh allowance without
erasing history. EMDEE remains a knowledge service with no AI inference.

## fcOS workspace (SPR-130)

app.whatelz.ai is fcOS, Founder’s Club Operating System. Mobile navigation: Today, Chat, Leads, HQH/HHH and Resources. Today reads only the signed-in member’s due follow-ups and accepted unfinished commitments. Resources retains products/calendar/culture/team. Chat adds bounded owner-private lead/note and permitted shared resource reads within the existing pilot, allowance and execution limits. Actual calendar membership is resolved server-side; tool input never supplies owner IDs or preview personas. EMDEE is optional; personal admin Daily remains separate.

Private HQH/HHH notes live in member_briefings, with RLS/no browser grants, independently verified server ownership, immutable identity, owner-validated lead references and optimistic revisions. Chat drafts enter a review form as reflections; explicit Save persists the record, and Reviewed is a human selection. No automatic sharing, RSVP, sponsor placement, account grants or commitment acceptance. Note list paginates 30 records, up to 20 leads per note; lead picker explicitly limits to first 200 own leads. Mirrored in EMDEE INSTRUCTIONS under “fcOS workspace (SPR-130)”.

## fcOS attention homepage (SPR-131)

The member root is an attention dashboard inspired by EMDEE: personal welcome, overdue/due follow-ups, accepted due/blocked/waiting commitments, private HQH/HHH drafts and permitted events from this month and next. Counts are exact with bounded lists and partial-source errors shown. No provider calls on page load; no inferred completions or RSVPs. API Chat is now Edmund-only: `memberActor` requires the configured stable owner ID plus privileged stored role before access lookup, reservation or provider use, even if another pilot account is active. Shared member leads, notes and resources keep their existing permissions.

## AI-business owner overview (SPR-133)

Admin root prioritizes accepted AI-business commitments, overdue/blocked/waiting
attention, saved personal Daily previews, marketing review queues and product
signals. `lib/admin-overview/server.ts` independently checks the configured owner
before every source. Missing sources stay unknown; proposals, deferred work and
other lanes never become accepted focus automatically. All reads are bounded or
exact aggregate counts; no inference or publishing runs on load. Existing Daily
schedules, owner/member access and app.whatelz.ai behavior remain unchanged.
Local active accounts and website visitors are distinct metrics; unmeasured ARR
and workspace counts are null. Remote product contracts are validated and stale
snapshots flagged. See docs/admin-overview.md; mirrored in EMDEE INSTRUCTIONS.
