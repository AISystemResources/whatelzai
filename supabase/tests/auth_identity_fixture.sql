create schema if not exists auth;
create table if not exists auth.users(id uuid primary key);
do $$ begin
 if not exists(select 1 from pg_roles where rolname='anon') then create role anon; end if;
 if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated; end if;
 if not exists(select 1 from pg_roles where rolname='service_role') then create role service_role bypassrls; end if;
end $$;
create table public.quiz_attempts(id uuid primary key default gen_random_uuid(),clerk_user_id text,clerk_user_email text);
create table public.subscriptions(id uuid primary key default gen_random_uuid(),clerk_id text not null);
create table public.entitlements(id uuid primary key default gen_random_uuid(),user_id text);
create table public.audit_log(actor_type text constraint audit_log_actor_type_check check(actor_type in ('token','clerk','anon')));
