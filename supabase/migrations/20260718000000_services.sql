-- services: catalog of paid offerings shown on /services (training, mentor, courses, etc.)
-- Shape mirrors projects: flat table, jsonb for variable pricing structure, published flag, sort_order.

create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category text not null,            -- 'training' | 'mentor' | 'course' | 'speak' | 'build'
  tagline text,
  description text,
  audience text,
  pricing_model text,                -- 'per_session' | 'per_hour' | 'per_seat' | 'package' | 'custom'
  pricing jsonb,                     -- structured tiers + optional founding block
  deliverables text[],
  terms jsonb,
  cta_label text,
  cta_url text,
  proof text,
  status text check (status in ('live','coming_soon','private','retired')) not null default 'live',
  featured boolean not null default false,
  content text,
  published boolean not null default false,
  sort_order integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table services enable row level security;
create policy "Public read published services" on services for select using (published = true);
create policy "Service role full access" on services using (true) with check (true);
