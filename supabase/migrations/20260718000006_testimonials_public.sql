-- Public submission flow: add contact fields, tags, moderation status, hackathon category.

alter table testimonials add column if not exists author_email text;
alter table testimonials add column if not exists author_linkedin_url text;
alter table testimonials add column if not exists tags text[];
alter table testimonials add column if not exists moderation_status text not null default 'approved'
  check (moderation_status in ('pending','approved','rejected'));
alter table testimonials add column if not exists submitted_at timestamptz;
alter table testimonials add column if not exists moderated_at timestamptz;

alter table testimonials drop constraint if exists testimonials_category_check;
alter table testimonials add constraint testimonials_category_check
  check (category in ('trainer','mentor','peer','academic','friend','hackathon'));

create index if not exists testimonials_moderation_idx on testimonials (moderation_status)
  where moderation_status = 'pending';

drop policy if exists "Public read published testimonials" on testimonials;
create policy "Public read approved published testimonials" on testimonials for select
  using (published = true and moderation_status = 'approved');

-- Storage bucket for public-submitted avatars — 5MB, images only, public read.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('testimonial-avatars', 'testimonial-avatars', true, 5242880,
  array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do nothing;
