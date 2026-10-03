-- Keep internal user IDs and historical Clerk IDs for payment-event reconciliation.
alter table public.users alter column clerk_user_id drop not null;
alter table public.users add column supabase_auth_user_id uuid unique references auth.users(id);
alter table public.quiz_attempts add column user_id uuid references public.users(id);
alter table public.quiz_attempts add column user_email text;
create index quiz_attempts_user_id_idx on public.quiz_attempts(user_id) where user_id is not null;
alter table public.subscriptions alter column clerk_id drop not null;
alter table public.subscriptions add column user_id uuid references public.users(id);
create index subscriptions_user_id_idx on public.subscriptions(user_id) where user_id is not null;
alter table public.audit_log drop constraint audit_log_actor_type_check;
alter table public.audit_log add constraint audit_log_actor_type_check check (actor_type in ('token','clerk','user','anon'));

-- Backfill ownership using the existing, explicit provider-to-internal mapping.
update public.quiz_attempts q set user_id=u.id,user_email=q.clerk_user_email from public.users u where q.clerk_user_id=u.clerk_user_id and q.user_id is null;
update public.subscriptions s set user_id=u.id from public.users u where s.clerk_id=u.clerk_user_id and s.user_id is null;
alter table public.entitlements add column app_user_id uuid references public.users(id);
create index entitlements_app_user_id_idx on public.entitlements(app_user_id) where app_user_id is not null;
update public.entitlements e set app_user_id=u.id from public.users u where e.user_id=u.clerk_user_id and e.app_user_id is null;

-- These features use server-checked authorization, not direct browser table access.
alter table public.quiz_attempts enable row level security;
alter table public.subscriptions enable row level security;
alter table public.entitlements enable row level security;
revoke all on public.quiz_attempts,public.subscriptions,public.entitlements from public,anon,authenticated;
grant select,insert,update,delete on public.quiz_attempts,public.subscriptions,public.entitlements to service_role;
