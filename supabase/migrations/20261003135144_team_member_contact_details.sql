-- Optional admin-managed contact details; no authentication or access changes.
alter table public.business_team_people add column email text;
alter table public.business_team_people add column abo_number text;
alter table public.business_team_people add constraint team_email_format check (email is null or (length(email) <= 254 and email = lower(btrim(email)) and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'));
alter table public.business_team_people add constraint team_abo_format check (abo_number is null or abo_number ~ '^[0-9]{1,20}$');
