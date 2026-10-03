-- Run after the legacy fixture, auth migration, users protection and team contact migration.
begin;
do $$ begin
 if (select role from public.users where id='00000000-0000-4000-8000-000000000001') <> 'superadmin' then raise exception 'Admin role changed'; end if;
 if exists(select 1 from public.quiz_attempts where user_id is distinct from '00000000-0000-4000-8000-000000000001'::uuid) then raise exception 'Quiz ownership lost'; end if;
 if exists(select 1 from public.subscriptions where user_id is distinct from '00000000-0000-4000-8000-000000000001'::uuid) then raise exception 'Subscription ownership lost'; end if;
 if exists(select 1 from public.entitlements where app_user_id is distinct from '00000000-0000-4000-8000-000000000001'::uuid or user_id <> 'legacy-test-owner') then raise exception 'Purchase ownership or legacy compatibility lost'; end if;
 if exists(select 1 from public.users where supabase_auth_user_id is not null) then raise exception 'Migration implicitly claimed identities'; end if;
end $$;
insert into auth.users(id) values('00000000-0000-4000-8000-000000000002');
insert into public.users(supabase_auth_user_id,email) values('00000000-0000-4000-8000-000000000002','owner@example.test');
do $$ begin
 if (select role from public.users where supabase_auth_user_id='00000000-0000-4000-8000-000000000002') <> 'unauthorized' then raise exception 'Email match gained privileges'; end if;
 if (select count(*) from public.users where email='owner@example.test') <> 2 then raise exception 'Sign-in merged by email'; end if;
 if exists(select 1 from public.business_team_accounts) then raise exception 'Sign-in claimed a team node'; end if;
end $$;
insert into public.audit_log(actor_type) values('user'),('clerk');
do $$ declare t text; r text; begin
 foreach t in array array['users','business_team_people','quiz_attempts','subscriptions','entitlements'] loop
  foreach r in array array['anon','authenticated'] loop
   if has_table_privilege(r,'public.'||t,'SELECT') or has_table_privilege(r,'public.'||t,'UPDATE') then raise exception 'Browser access remains: % %',r,t; end if;
  end loop;
  if not has_table_privilege('service_role','public.'||t,'SELECT,INSERT,UPDATE,DELETE') then raise exception 'Server privileges lost: %',t; end if;
 end loop;
end $$;
insert into public.business_teams(id,slug,name,focus_person_id) values('00000000-0000-4000-8000-000000000010','test-profiles','Test profiles','00000000-0000-4000-8000-000000000011');
insert into public.business_team_people(id,team_id,display_name,email,abo_number) values('00000000-0000-4000-8000-000000000011','00000000-0000-4000-8000-000000000010','Test person','person@example.test','00012345');
set constraints all immediate;
do $$ begin
 if (select abo_number from public.business_team_people where id='00000000-0000-4000-8000-000000000011') <> '00012345' then raise exception 'Leading zeros lost'; end if;
 begin update public.business_team_people set email='bad-email'; raise exception 'Invalid email accepted'; exception when check_violation then null; end;
 begin update public.business_team_people set abo_number='ABC'; raise exception 'Invalid ABO accepted'; exception when check_violation then null; end;
end $$;
rollback;
