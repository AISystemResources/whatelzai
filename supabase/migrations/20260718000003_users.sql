-- users: tracks Clerk sign-ins with a role for admin-gating.
-- Row-per-Clerk-user, upserted via ensureUserRow() on any authenticated request.
-- Role starts as 'unauthorized'; admins are promoted manually via Studio (or later, admin UI).

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text unique not null,
  email text not null,
  role text not null default 'unauthorized' check (role in ('superadmin','admin','unauthorized')),
  name text,
  image_url text,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists users_email_idx on users (lower(email));

alter table users enable row level security;
create policy "Service role full access" on users using (true) with check (true);
-- No public read policy: users table is service-role-only.
