-- testimonials: client / mentee / peer / academic / friend quotes shown on the landing page.
-- Priority order for featured = trainer > mentor > peer > academic > friend.

create table if not exists testimonials (
  id uuid primary key default gen_random_uuid(),
  quote text not null,
  long_quote text,
  author_name text not null,
  author_role text,
  author_company text,
  author_avatar_url text,
  context text,
  outcome_tag text,
  category text not null default 'peer' check (category in ('trainer','mentor','peer','academic','friend')),
  featured boolean not null default false,
  published boolean not null default false,
  sort_order integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists testimonials_category_idx on testimonials (category);
create index if not exists testimonials_featured_idx on testimonials (featured) where featured = true;

alter table testimonials enable row level security;
create policy "Public read published testimonials" on testimonials for select using (published = true);
create policy "Service role full access" on testimonials using (true) with check (true);
