-- Multiple role/company affiliations on testimonials, and a service_events table
-- for tagging testimonials to specific past sessions.

alter table testimonials add column if not exists author_affiliations jsonb;

update testimonials
set author_affiliations = jsonb_build_array(
  jsonb_build_object(
    'role', coalesce(author_role, ''),
    'company', coalesce(author_company, '')
  )
)
where author_affiliations is null
  and (author_role is not null or author_company is not null);

alter table testimonials drop column if exists author_role;
alter table testimonials drop column if exists author_company;

create table if not exists service_events (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  kind text not null default 'training' check (kind in ('training','workshop','mentorship','talk','hackathon','other')),
  event_date date,
  location text,
  description text,
  attendee_count integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists service_events_date_idx on service_events (event_date desc);

alter table service_events enable row level security;
create policy "Public read service events" on service_events for select using (true);
create policy "Service role full access events" on service_events using (true) with check (true);

alter table testimonials add column if not exists service_event_id uuid
  references service_events(id) on delete set null;
create index if not exists testimonials_service_event_idx on testimonials (service_event_id);
