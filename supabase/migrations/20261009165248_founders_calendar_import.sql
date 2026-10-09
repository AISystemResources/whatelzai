create table public.community_calendar_imports (
  id text primary key,
  sender text not null,
  imported_at timestamptz not null,
  message_count integer not null check (message_count > 0),
  record_count integer not null check (record_count > 0),
  checksum text not null check (checksum ~ '^[a-f0-9]{64}$')
);
create table public.community_calendar_records (
  import_id text not null references public.community_calendar_imports(id),
  id text not null,
  uid text not null,
  recurrence_id text not null default '',
  sequence integer not null check (sequence >= 0),
  revision_at timestamptz not null,
  message_id text not null,
  received_at timestamptz not null,
  ics text not null check (length(ics) between 1 and 100000),
  primary key (import_id, id)
);
alter table public.community_calendar_imports enable row level security;
alter table public.community_calendar_records enable row level security;
revoke all on public.community_calendar_imports, public.community_calendar_records from public, anon, authenticated;
grant select, insert, update on public.community_calendar_imports, public.community_calendar_records to service_role;
create index community_calendar_latest_import on public.community_calendar_imports(imported_at desc);
