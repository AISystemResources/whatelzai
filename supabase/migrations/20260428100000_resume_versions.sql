-- resume_versions: one row per named variant (AI Engineer, Blockchain Engineer, Software Engineer)
create table if not exists public.resume_versions (
  id          uuid primary key default gen_random_uuid(),
  variant     text not null unique,
  content     text not null default '',
  pdf_url     text,
  pdf_path    text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.resume_versions enable row level security;
create policy "service role full access" on public.resume_versions
  using (true) with check (true);

-- Seed the three variants so they always exist
insert into public.resume_versions (variant) values
  ('AI Engineer'),
  ('Blockchain Engineer'),
  ('Software Engineer')
on conflict (variant) do nothing;

-- Storage bucket for exported PDFs
insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', true)
on conflict (id) do nothing;

create policy "service role can manage resume pdfs"
  on storage.objects for all
  using (bucket_id = 'resumes')
  with check (bucket_id = 'resumes');
