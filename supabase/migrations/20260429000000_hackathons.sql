create table if not exists public.hackathons (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  organizer     text,
  date          date not null,
  location      text,
  awards        jsonb not null default '[]',
  demo_url      text,
  writeup       text not null default '',
  tags          text[] not null default '{}',
  thumbnail_url text,
  published     boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.hackathons enable row level security;

create policy "public read published" on public.hackathons
  for select using (published = true);

create policy "service role full access" on public.hackathons
  using (true) with check (true);
