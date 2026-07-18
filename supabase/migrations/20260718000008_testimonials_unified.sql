-- Consolidate testimonials + invites. A testimonial owns its own completion_token.
-- Status: incomplete -> pending -> approved | rejected.
-- Drops legacy columns (long_quote, context, tags) and separate testimonial_invites table.

drop policy if exists "Public read approved published testimonials" on testimonials;
drop policy if exists "Public read published testimonials" on testimonials;

alter table testimonials add column if not exists status text;
alter table testimonials add column if not exists completion_token text;
alter table testimonials add column if not exists suggested_question_ids text[];
alter table testimonials add column if not exists admin_note text;
alter table testimonials add column if not exists created_by_clerk_id text;

update testimonials set status = moderation_status where status is null;
alter table testimonials alter column status set default 'pending';
alter table testimonials alter column status set not null;

alter table testimonials drop constraint if exists testimonials_status_check;
alter table testimonials add constraint testimonials_status_check
  check (status in ('incomplete','pending','approved','rejected'));

create unique index if not exists testimonials_completion_token_key on testimonials (completion_token)
  where completion_token is not null;
create index if not exists testimonials_status_idx on testimonials (status);

alter table testimonials drop column if exists moderation_status;
alter table testimonials drop column if exists long_quote;
alter table testimonials drop column if exists context;
alter table testimonials drop column if exists tags;

create policy "Public read approved published testimonials" on testimonials for select
  using (status = 'approved' and published = true);

drop table if exists testimonial_invites;
