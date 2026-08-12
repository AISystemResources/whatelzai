-- SPRINT-108 — HVCO quiz #1 (What kind of solopreneur are you?)
-- Config tables (quizzes/questions/choices/archetypes) are public-read where published.
-- Event table (quiz_attempts) is admin-only via supabaseAdmin; RLS deny-all for anon.

create table if not exists quizzes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  subtitle text,
  intro_md text,
  cta_label text default 'Start quiz',
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quizzes(id) on delete cascade,
  sort_order integer not null,
  prompt text not null,
  helper_md text,
  question_type text not null default 'single_choice',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (quiz_id, sort_order)
);

create table if not exists quiz_choices (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references quiz_questions(id) on delete cascade,
  sort_order integer not null,
  label text not null,
  -- Weighted scoring: each choice contributes weights to N archetypes.
  -- Example: {"CEILING-BREAKER": 3, "CHAOS-OPERATOR": 1}
  archetype_weights jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (question_id, sort_order)
);

create table if not exists quiz_archetypes (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quizzes(id) on delete cascade,
  key text not null,               -- e.g. 'CEILING-BREAKER'
  name text not null,              -- display name
  sort_order integer not null default 0,   -- tie-breaker: lower wins
  one_line text not null,          -- preview screen
  full_report_md text,             -- unlocked report body
  ebook_url text,                  -- placeholder null; real URL later
  ebook_label text default 'Click here to access this ebook',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (quiz_id, key)
);

create table if not exists quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quizzes(id) on delete cascade,
  session_id text,                 -- anonymous browser session
  answers jsonb not null default '[]'::jsonb,  -- [{q_id, choice_id}]
  scores jsonb not null default '{}'::jsonb,   -- per-archetype tally
  archetype_key text,              -- winning archetype (null until scored)
  clerk_user_id text,              -- set on unlock
  clerk_user_email text,           -- captured at unlock for audit
  ip inet,
  user_agent text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  unlocked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists quiz_attempts_quiz_id_idx on quiz_attempts(quiz_id);
create index if not exists quiz_attempts_clerk_user_id_idx on quiz_attempts(clerk_user_id) where clerk_user_id is not null;
create index if not exists quiz_attempts_session_id_idx on quiz_attempts(session_id) where session_id is not null;
create index if not exists quiz_attempts_completed_at_idx on quiz_attempts(completed_at) where completed_at is not null;

-- updated_at triggers
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

do $$ begin
  create trigger t_quizzes_updated before update on quizzes for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger t_quiz_questions_updated before update on quiz_questions for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger t_quiz_choices_updated before update on quiz_choices for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger t_quiz_archetypes_updated before update on quiz_archetypes for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger t_quiz_attempts_updated before update on quiz_attempts for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;

-- RLS
alter table quizzes enable row level security;
alter table quiz_questions enable row level security;
alter table quiz_choices enable row level security;
alter table quiz_archetypes enable row level security;
alter table quiz_attempts enable row level security;

-- Config tables: anon read where published, admin full via service role.
create policy quizzes_anon_read on quizzes for select to anon using (published = true);
create policy quizzes_auth_read on quizzes for select to authenticated using (published = true);

create policy quiz_questions_anon_read on quiz_questions for select to anon
  using (exists (select 1 from quizzes q where q.id = quiz_questions.quiz_id and q.published = true));
create policy quiz_questions_auth_read on quiz_questions for select to authenticated
  using (exists (select 1 from quizzes q where q.id = quiz_questions.quiz_id and q.published = true));

create policy quiz_choices_anon_read on quiz_choices for select to anon
  using (exists (
    select 1 from quiz_questions qq join quizzes q on q.id = qq.quiz_id
    where qq.id = quiz_choices.question_id and q.published = true
  ));
create policy quiz_choices_auth_read on quiz_choices for select to authenticated
  using (exists (
    select 1 from quiz_questions qq join quizzes q on q.id = qq.quiz_id
    where qq.id = quiz_choices.question_id and q.published = true
  ));

create policy quiz_archetypes_anon_read on quiz_archetypes for select to anon
  using (exists (select 1 from quizzes q where q.id = quiz_archetypes.quiz_id and q.published = true));
create policy quiz_archetypes_auth_read on quiz_archetypes for select to authenticated
  using (exists (select 1 from quizzes q where q.id = quiz_archetypes.quiz_id and q.published = true));

-- Attempts: no anon or authenticated policies. Service role bypasses RLS entirely.
-- All writes/reads go through server routes with supabaseAdmin.
