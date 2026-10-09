create table public.community_calendar_memberships (
  user_id uuid primary key references public.users(id) on delete cascade,
  persona text not null check (persona in ('Oracle','Catalyst','Spark','Guest')),
  updated_by uuid not null references public.users(id),
  updated_at timestamptz not null default now()
);
-- The founder persona belongs to a single explicitly verified account.
create unique index community_calendar_one_oracle on public.community_calendar_memberships(persona) where persona = 'Oracle';
alter table public.community_calendar_memberships enable row level security;
revoke all on public.community_calendar_memberships from public, anon, authenticated;
grant select, insert, update on public.community_calendar_memberships to service_role;
