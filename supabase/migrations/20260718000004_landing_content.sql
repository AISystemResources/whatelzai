-- landing_content: one row per homepage section (provocation, pov, track_record, training_offer).
-- jsonb body carries the section-specific shape. {{accent:foo}} markers in text
-- render as brand-yellow via components/shell/AccentText.

create table if not exists landing_content (
  id uuid primary key default gen_random_uuid(),
  section_key text unique not null,
  body jsonb not null,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table landing_content enable row level security;
create policy "Public read published landing content" on landing_content for select using (published = true);
create policy "Service role full access" on landing_content using (true) with check (true);
