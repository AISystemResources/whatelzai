-- Clerk-backed identities and admin roles are maintained only by server code.
-- The legacy "Service role full access" policy applied to every API role.
alter table public.users enable row level security;
revoke all on public.users from public, anon, authenticated;
grant select, insert, update, delete on public.users to service_role;
do $$
declare p record;
begin
  for p in select policyname from pg_policies where schemaname = 'public' and tablename = 'users' loop
    execute format('alter policy %I on public.users to service_role', p.policyname);
  end loop;
end;
$$;
