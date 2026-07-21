-- Group prefill templates. Each template generates a QR-friendly public
-- URL (/feedback/t/<slug>); every submission spawns a new testimonials
-- row with the template's prefills applied and template_id set for
-- attribution / reporting.

create table if not exists testimonial_templates (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  category text not null,
  company_name text,
  default_role text,
  service_event_id uuid references service_events(id) on delete set null,
  suggested_question_ids text[] not null default '{}',
  expires_at timestamptz,
  max_submissions integer check (max_submissions is null or max_submissions > 0),
  submissions_count integer not null default 0,
  is_active boolean not null default true,
  created_by_clerk_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists testimonial_templates_active_idx
  on testimonial_templates (is_active);

comment on table testimonial_templates is
  'Group-prefill definitions. Each template exposes a public URL at '
  '/feedback/t/<slug>; scanning creates fresh testimonials rows with '
  'prefills applied. Closed when is_active=false OR expires_at passed '
  'OR submissions_count >= max_submissions.';

-- Trace which template a testimonial spawned from (for reporting +
-- moderation heuristics).
alter table testimonials
  add column if not exists template_id uuid references testimonial_templates(id) on delete set null;

create index if not exists testimonials_template_idx
  on testimonials (template_id) where template_id is not null;
