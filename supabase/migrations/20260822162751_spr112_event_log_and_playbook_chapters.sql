-- SPR-112: event emitter data plane (per ARC-009) + playbook chapters config
-- (per DEC-CEO-004 §6 data-driven chapter ordering requirement).

-- ── event_log (ARC-009 §"The table") ──────────────────────────────
create table if not exists public.event_log (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  event_type text not null,
  user_id text,
  session_id text,
  source text not null check (source in ('server', 'client')),
  payload jsonb not null default '{}'::jsonb,
  ip_hash text,
  user_agent text
);

create index if not exists idx_event_log_type_occurred
  on public.event_log (event_type, occurred_at desc);
create index if not exists idx_event_log_user_occurred
  on public.event_log (user_id, occurred_at desc)
  where user_id is not null;
create index if not exists idx_event_log_session_occurred
  on public.event_log (session_id, occurred_at desc)
  where session_id is not null;

comment on table public.event_log is
  'Retention/telemetry event ledger per ARC-009. Append-only. Never mutate rows post-insert. Payload shape per event_type frozen in ARC-009 v1 for playbook.session_start + playbook.chapter_viewed; other types are accepted (no enum check).';

alter table public.event_log enable row level security;
-- No policies — service-role only. Client emissions go through /api/events
-- which validates + writes via service role.

-- ── playbook_chapters (data-driven per DEC-CEO-004 §6) ────────────
-- Rows describe available chapters. Content itself is Edmund's authorship
-- track (DEC-CEO-004 §8) — this table just enumerates them so the paywall
-- surface + /account/playbook can render an ordered list without JSX
-- hardcoding chapter slugs.
create table if not exists public.playbook_chapters (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  part smallint not null check (part between 1 and 4),
  ordinal smallint not null,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_playbook_chapters_part_ordinal
  on public.playbook_chapters (part, ordinal)
  where published = true;

alter table public.playbook_chapters enable row level security;

create policy playbook_chapters_public_read
  on public.playbook_chapters for select
  using (published = true);

comment on table public.playbook_chapters is
  'Enumerates Playbook chapters. Ordering per archetype lives in quiz_archetypes.chapter_order (jsonb array of slugs). If an archetype has no chapter_order, fall back to ordering by (part, ordinal).';

-- ── quiz_archetypes.chapter_order — per-archetype reading order ────
-- Nullable jsonb array of chapter slugs. Null = use default ordering.
alter table public.quiz_archetypes
  add column if not exists chapter_order jsonb;

comment on column public.quiz_archetypes.chapter_order is
  'Per-archetype ordered reading path — array of playbook_chapters.slug strings. Null = fall back to (part, ordinal) default. Feeds /account/playbook per SPR-112.';

-- ── quiz_attempts.clerk_user_id index (paywall stitching lookup) ───
-- SPR-108 already has (clerk_user_id) on this table; add the case where
-- we look up "most recent completed attempt per user" for /account.
create index if not exists idx_quiz_attempts_user_completed
  on public.quiz_attempts (clerk_user_id, completed_at desc)
  where clerk_user_id is not null and completed_at is not null;
