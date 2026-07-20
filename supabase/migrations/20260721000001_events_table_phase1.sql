-- PHASE 1 (additive) of the events/hackathons/service_events unification.
--
-- Creates the unified `events` table and backfills from both source tables.
-- Dual-write for new upserts happens in code (lib/hackathons + lib/service-events).
-- READ PATHS ARE UNCHANGED IN PHASE 1 — public /hackathons still queries the
-- hackathons table. Phase 2 flips reads. Phase 3 drops the old tables.
--
-- Legacy cross-refs (legacy_hackathon_id, legacy_service_event_id) let us:
--   - detect + skip duplicate backfills (a row that came from both tables)
--   - reconcile row-level identity across the phased migration
--   - drop the old tables cleanly in Phase 3

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  type text not null check (
    type in ('hackathon', 'training', 'workshop', 'mentorship', 'talk', 'other')
  ),
  slug text,
  name text not null,
  date date,
  location text,
  notes text,
  metadata jsonb not null default '{}',
  published boolean not null default false,
  legacy_hackathon_id uuid unique references hackathons(id) on delete set null,
  legacy_service_event_id uuid unique references service_events(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists events_slug_unique
  on events (slug) where slug is not null;
create index if not exists events_type_published_idx
  on events (type, published);
create index if not exists events_date_idx on events (date desc nulls last);

comment on table events is
  'Unified event ledger — hackathons Edmund joined, trainings he ran, etc. '
  'Testimonials will FK here (event_id) once Phase 2 flips reads.';
comment on column events.metadata is
  'Type-specific fields. Hackathons: {organizer, awards, demo_url, writeup, '
  'tags, thumbnail_url, team, tier, project_name, content}. '
  'Service events: {description, attendee_count}.';

-- Backfill from hackathons.
insert into events (
  type, slug, name, date, location, published,
  metadata, legacy_hackathon_id, created_at, updated_at
)
select
  'hackathon' as type,
  h.slug,
  h.name,
  h.date::date,
  h.location,
  h.published,
  jsonb_strip_nulls(jsonb_build_object(
    'organizer', h.organizer,
    'awards', to_jsonb(h.awards),
    'demo_url', h.demo_url,
    'writeup', h.writeup,
    'tags', to_jsonb(h.tags),
    'thumbnail_url', h.thumbnail_url,
    'team', to_jsonb(h.team),
    'tier', h.tier,
    'project_name', h.project_name,
    'content', h.content
  )) as metadata,
  h.id,
  h.created_at,
  h.updated_at
from hackathons h
on conflict (legacy_hackathon_id) do nothing;

-- Reconcile: service_events rows of kind='hackathon' that match an existing
-- backfilled hackathon by name + date-within-7-days get linked (not duplicated).
with matched as (
  select se.id as se_id, e.id as e_id
  from service_events se
  join events e on
    e.type = 'hackathon'
    and se.kind = 'hackathon'
    and lower(trim(se.name)) = lower(trim(e.name))
    and (
      se.event_date is null
      or abs(extract(epoch from (se.event_date::date - e.date)) / 86400) <= 7
    )
)
update events e
set legacy_service_event_id = m.se_id
from matched m
where e.id = m.e_id
  and e.legacy_service_event_id is null;

-- Backfill remaining service_events (those not reconciled above).
insert into events (
  type, slug, name, date, location, published,
  metadata, legacy_service_event_id, created_at, updated_at
)
select
  se.kind as type,
  -- Prefix non-hackathon slugs to avoid collision with hackathon slugs.
  case when se.slug is not null and se.slug <> ''
       then se.kind || '-' || se.slug
       else null end as slug,
  se.name,
  se.event_date::date,
  se.location,
  true as published,
  jsonb_strip_nulls(jsonb_build_object(
    'description', se.description,
    'attendee_count', se.attendee_count,
    'original_slug', se.slug
  )) as metadata,
  se.id,
  se.created_at,
  se.updated_at
from service_events se
where not exists (
  select 1 from events e where e.legacy_service_event_id = se.id
)
on conflict (legacy_service_event_id) do nothing;
