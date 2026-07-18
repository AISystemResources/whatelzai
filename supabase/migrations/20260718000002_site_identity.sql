-- Single-row table for owner identity: name, email, socials, portrait, tagline.
-- Enforced single-row via `singleton` boolean unique-true.

create table if not exists site_identity (
  id uuid primary key default gen_random_uuid(),
  singleton boolean not null default true,
  owner_name text not null,
  owner_short_name text not null,
  owner_first_name text not null,
  owner_initials text,
  email text not null,
  linkedin_url text,
  portrait_url text,
  tagline text,
  meta_description text,
  location text,
  bio text,
  resume_url text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_identity_singleton_unique unique (singleton),
  constraint site_identity_singleton_true check (singleton = true)
);

alter table site_identity enable row level security;
create policy "Public read site identity" on site_identity for select using (true);
create policy "Service role full access" on site_identity using (true) with check (true);
