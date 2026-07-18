-- Structured Q&A on testimonials + invite tokens for pre-filled public submissions.

alter table testimonials add column if not exists quote_answers jsonb;

create table if not exists testimonial_invites (
  id uuid primary key default gen_random_uuid(),
  token text unique not null,
  prefill jsonb not null default '{}'::jsonb,
  note text,
  created_by_clerk_id text,
  used_at timestamptz,
  submission_id uuid references testimonials(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists testimonial_invites_token_idx on testimonial_invites (token);
create index if not exists testimonial_invites_used_idx on testimonial_invites (used_at) where used_at is null;

alter table testimonial_invites enable row level security;
create policy "Service role full access invites" on testimonial_invites using (true) with check (true);
