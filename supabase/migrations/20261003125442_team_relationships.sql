-- Contacts and sponsor placement are independent of Clerk login accounts.
create table public.business_teams (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (length(trim(name)) between 1 and 120),
  focus_person_id uuid not null,
  created_at timestamptz not null default now()
);

create table public.business_team_people (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.business_teams(id) on delete cascade,
  display_name text not null check (length(trim(display_name)) between 1 and 120),
  sponsor_person_id uuid,
  context text check (length(context) <= 240),
  created_at timestamptz not null default now(),
  unique (team_id, id),
  check (sponsor_person_id is distinct from id),
  foreign key (team_id, sponsor_person_id)
    references public.business_team_people(team_id, id)
    deferrable initially deferred
);
create index business_team_people_sponsor_idx
  on public.business_team_people(team_id, sponsor_person_id);

alter table public.business_teams add constraint business_teams_focus_fk
  foreign key (id, focus_person_id)
  references public.business_team_people(team_id, id)
  deferrable initially deferred;

create table public.business_team_accounts (
  team_id uuid not null references public.business_teams(id) on delete cascade,
  person_id uuid not null,
  user_id uuid not null references public.users(id) on delete cascade,
  access_role text not null default 'member' check (access_role in ('member','manager')),
  created_at timestamptz not null default now(),
  primary key (team_id, person_id),
  unique (user_id, team_id),
  foreign key (team_id, person_id)
    references public.business_team_people(team_id, id) on delete cascade
);

-- A team lock serializes sponsor changes. Names may repeat; IDs may not.
create function public.check_business_sponsor() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and (new.team_id <> old.team_id or new.id <> old.id) then
    raise exception 'Person identity and team cannot be changed';
  end if;
  perform 1 from public.business_teams where id = new.team_id for update;
  if new.sponsor_person_id is not null and exists (
    with recursive ancestors(id) as (
      select new.sponsor_person_id
      union
      select p.sponsor_person_id
      from public.business_team_people p join ancestors a on p.id = a.id
      where p.team_id = new.team_id and p.sponsor_person_id is not null
    ) select 1 from ancestors where id = new.id
  ) then raise exception 'Sponsor cycle'; end if;
  return new;
end;
$$;
create trigger business_team_people_sponsor_check
  before insert or update on public.business_team_people
  for each row execute function public.check_business_sponsor();

-- Atomic private import. An existing team is never overwritten by a seed.
create function public.import_business_team(seed jsonb) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  team_id uuid := (seed->'team'->>'id')::uuid;
  person jsonb;
begin
  insert into public.business_teams(id, slug, name, focus_person_id)
  values (team_id, seed->'team'->>'slug', seed->'team'->>'name',
    (seed->'team'->>'focus_person_id')::uuid);
  for person in select value from jsonb_array_elements(seed->'people') loop
    if (person->>'team_id')::uuid is distinct from team_id then
      raise exception 'Cross-team person';
    end if;
    insert into public.business_team_people(id, team_id, display_name, sponsor_person_id, context)
    values ((person->>'id')::uuid, team_id, person->>'display_name',
      (person->>'sponsor_person_id')::uuid, person->>'context');
  end loop;
  return team_id;
end;
$$;

-- Clerk is verified in the server. Browser Supabase roles have no access.
alter table public.business_teams enable row level security;
alter table public.business_team_people enable row level security;
alter table public.business_team_accounts enable row level security;
revoke all on public.business_teams, public.business_team_people, public.business_team_accounts
  from public, anon, authenticated;
grant select, insert, update, delete on public.business_teams, public.business_team_people, public.business_team_accounts
  to service_role;
revoke all on function public.check_business_sponsor() from public, anon, authenticated;
revoke all on function public.import_business_team(jsonb) from public, anon, authenticated;
grant execute on function public.check_business_sponsor() to service_role;
grant execute on function public.import_business_team(jsonb) to service_role;
