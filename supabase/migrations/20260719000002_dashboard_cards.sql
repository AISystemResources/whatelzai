-- dashboard_cards — write-back surface for Claude Schedule / MCP briefings.
-- Any product's scheduled Claude run can upsert a card here; the whatelz.ai
-- admin homepage renders them. Cards keyed by string so a "morning-briefing"
-- card overwrites itself daily instead of accumulating.
-- Staleness is derived from updated_at + expected_cadence_hours in the UI:
-- if now() > updated_at + expected_cadence_hours, the card is stale — the
-- absence of a fresh briefing becomes visible instead of silently missing.

create table if not exists public.dashboard_cards (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  title text not null,
  body_markdown text not null,
  meta jsonb,
  source text,
  expected_cadence_hours integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_dashboard_cards_updated_at
  on public.dashboard_cards (updated_at desc);

comment on table public.dashboard_cards is
  'Briefing cards written by Claude Schedule / MCP clients. Rendered on /admin. Keyed by string for idempotent upsert.';
comment on column public.dashboard_cards.key is
  'Stable identifier for the card, e.g. "morning-briefing" or "doublelead-dau". Upserts overwrite.';
comment on column public.dashboard_cards.body_markdown is
  'Markdown body produced by Claude in the client. Server never generates this.';
comment on column public.dashboard_cards.meta is
  'Free-form structured payload (e.g. { dau: 320, delta_pct: 12 }). Opaque to the UI unless a card type wants a richer render.';
comment on column public.dashboard_cards.source is
  'Which agent/schedule wrote the card. Useful for tracing when a briefing looks wrong.';
comment on column public.dashboard_cards.expected_cadence_hours is
  'Cadence the writer expects. UI shows a stale badge when now() > updated_at + this. Null = no staleness check.';

-- RLS: admin-only via service role. No client reads through anon key.
alter table public.dashboard_cards enable row level security;
-- No policies defined — service role bypasses RLS, everyone else denied.
