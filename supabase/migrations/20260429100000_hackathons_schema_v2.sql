alter table public.hackathons
  add column if not exists team         text[] not null default '{}',
  add column if not exists tier         text not null default 'coding'
                           check (tier in ('coding', 'non-coding')),
  add column if not exists project_name text;
