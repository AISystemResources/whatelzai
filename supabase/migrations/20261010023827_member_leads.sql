-- Private relationship notes. Authenticated browser roles have no table access.
create table public.member_leads (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users(id),
  name text not null check (length(btrim(name)) between 1 and 160),
  region text not null default 'Unassigned' check (region in ('FC Central','FC Northern','FC Southern','Unassigned')),
  membership text not null default 'Unknown' check (membership in ('Unknown','Guest','Spark','Catalyst')),
  stage text not null default 'Raw namelist' check (stage in ('Raw namelist','Invited','Engaged','Following up','ABO','APC','Not now')),
  goal text not null default 'Undecided' check (goal in ('Undecided','ABO','APC')),
  email text not null default '' check (length(email) <= 254),
  phone text not null default '' check (length(phone) <= 80),
  birthday date,
  zodiac text not null default '' check (length(zodiac) <= 80),
  relationship text not null default '' check (length(relationship) <= 2000),
  story text not null default '' check (length(story) <= 10000),
  interests text not null default '' check (length(interests) <= 4000),
  concerns text not null default '' check (length(concerns) <= 4000),
  notes text not null default '' check (length(notes) <= 10000),
  next_action text not null default '' check (length(next_action) <= 1000),
  follow_up_on date,
  revision integer not null default 1 check (revision > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, owner_id)
);
create index member_leads_owner_region on public.member_leads(owner_id,region);
create index member_leads_owner_follow_up on public.member_leads(owner_id,follow_up_on);

create table public.member_lead_activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null,
  owner_id uuid not null references public.users(id),
  title text not null check (length(btrim(title)) between 1 and 240),
  activity_on date not null,
  status text not null check (status in ('Attended','Planned','To invite','Conversation','Missed','Cancelled')),
  notes text not null default '' check (length(notes) <= 4000),
  revision integer not null default 1 check (revision > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (lead_id,owner_id) references public.member_leads(id,owner_id)
);
create index member_lead_activities_owner_lead_date on public.member_lead_activities(owner_id,lead_id,activity_on);
alter table public.member_leads enable row level security;
alter table public.member_lead_activities enable row level security;
revoke all on public.member_leads,public.member_lead_activities from public,anon,authenticated;
grant select,insert,update on public.member_leads,public.member_lead_activities to service_role;
comment on table public.member_leads is 'Owner-private CRM. Verified server reads/mutations always scope to stable users.id; no team-wide or public access.';
