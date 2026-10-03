-- Run after users, team_relationships and protect_clerk_user_roles migrations in an isolated database.
-- Entire test rolls back; names and emails below are synthetic.
begin;
select public.import_business_team('{
  "team":{"id":"10000000-0000-4000-8000-000000000001","slug":"test-team","name":"Test team","focus_person_id":"20000000-0000-4000-8000-000000000002"},
  "people":[
    {"id":"20000000-0000-4000-8000-000000000001","team_id":"10000000-0000-4000-8000-000000000001","display_name":"Repeated name","sponsor_person_id":null},
    {"id":"20000000-0000-4000-8000-000000000002","team_id":"10000000-0000-4000-8000-000000000001","display_name":"Member A","sponsor_person_id":"20000000-0000-4000-8000-000000000001"},
    {"id":"20000000-0000-4000-8000-000000000003","team_id":"10000000-0000-4000-8000-000000000001","display_name":"Repeated name","sponsor_person_id":"20000000-0000-4000-8000-000000000002"}
  ]
}'::jsonb);
set constraints all immediate;

do $$
declare
  table_name text;
  role_name text;
  operation text;
begin
  if (select count(*) from public.business_team_people where team_id = '10000000-0000-4000-8000-000000000001') <> 3 then raise exception 'Import failed'; end if;
  if (select count(*) from public.business_team_people where team_id = '10000000-0000-4000-8000-000000000001' and display_name = 'Repeated name') <> 2 then raise exception 'Duplicate names were merged'; end if;
  if (select count(*) from public.business_team_accounts where team_id = '10000000-0000-4000-8000-000000000001') <> 0 then raise exception 'Accounts linked without verification'; end if;
  begin
    update public.business_team_people set sponsor_person_id = '20000000-0000-4000-8000-000000000003' where id = '20000000-0000-4000-8000-000000000001';
    raise exception 'Cycle was accepted';
  exception when raise_exception then
    if sqlerrm <> 'Sponsor cycle' then raise; end if;
  end;
  begin
    update public.business_team_people set sponsor_person_id = id where id = '20000000-0000-4000-8000-000000000002';
    raise exception 'Self sponsor was accepted';
  exception when raise_exception then
    if sqlerrm <> 'Sponsor cycle' then raise; end if;
  end;
  begin
    update public.business_team_people set sponsor_person_id = '20000000-0000-4000-8000-000000000099' where id = '20000000-0000-4000-8000-000000000002';
    raise exception 'Missing sponsor was accepted';
  exception when foreign_key_violation then null;
  end;
  begin
    update public.business_team_people set team_id = '10000000-0000-4000-8000-000000000002' where id = '20000000-0000-4000-8000-000000000002';
    raise exception 'Team mutation was accepted';
  exception when raise_exception then
    if sqlerrm <> 'Person identity and team cannot be changed' then raise; end if;
  end;
  foreach table_name in array array['users','business_teams','business_team_people','business_team_accounts'] loop
    if not (select relrowsecurity from pg_class where oid = ('public.' || table_name)::regclass) then raise exception 'RLS missing'; end if;
    foreach role_name in array array['anon','authenticated'] loop
      foreach operation in array array['SELECT','INSERT','UPDATE','DELETE'] loop
        if has_table_privilege(role_name,'public.' || table_name,operation) then raise exception 'Browser role has table access'; end if;
      end loop;
      if has_function_privilege(role_name,'public.import_business_team(jsonb)','EXECUTE') then raise exception 'Browser role has import access'; end if;
    end loop;
    foreach operation in array array['SELECT','INSERT','UPDATE','DELETE'] loop
      if not has_table_privilege('service_role','public.' || table_name,operation) then raise exception 'Service grant missing'; end if;
    end loop;
  end loop;
end;
$$;

insert into public.users(id,clerk_user_id,email) values
  ('30000000-0000-4000-8000-000000000001','test-account-a','a@example.test'),
  ('30000000-0000-4000-8000-000000000002','test-account-b','b@example.test');
insert into public.business_team_accounts(team_id,person_id,user_id) values
  ('10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000001');
do $$ begin
  begin
    insert into public.business_team_accounts(team_id,person_id,user_id) values
      ('10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000003','30000000-0000-4000-8000-000000000001');
    raise exception 'Account linked twice';
  exception when unique_violation then null;
  end;
  begin
    insert into public.business_team_accounts(team_id,person_id,user_id) values
      ('10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000002');
    raise exception 'Person linked twice';
  exception when unique_violation then null;
  end;
  if (select role from public.users where id = '30000000-0000-4000-8000-000000000001') <> 'unauthorized' then raise exception 'Team membership granted global admin'; end if;
end $$;

set local role authenticated;
do $$ begin
  begin
    perform 1 from public.business_team_people;
    raise exception 'Authenticated direct read allowed';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
rollback;
