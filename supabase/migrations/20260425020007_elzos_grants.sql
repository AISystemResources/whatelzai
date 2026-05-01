grant usage on schema elzos to anon, authenticated, service_role;
grant all on all tables in schema elzos to service_role;
grant all on all sequences in schema elzos to service_role;
grant all on all functions in schema elzos to service_role;
alter default privileges in schema elzos grant all on tables to service_role;
alter default privileges in schema elzos grant all on sequences to service_role;
alter default privileges in schema elzos grant all on functions to service_role;
