-- ELZ OS tenant — its own schema in the same Supabase project.
create schema if not exists elzos;

create table if not exists elzos.docs_sections (
    id           uuid primary key default gen_random_uuid(),
    doc_slug     text not null,
    heading      text not null,
    position     integer not null,
    content      text not null default '',
    version      integer not null default 1,
    is_current   boolean not null default true,
    updated_by   text,
    created_at   timestamptz not null default now(),
    updated_at   timestamptz not null default now(),
    constraint elzos_docs_sections_slug_check check (
        doc_slug in ('INSTRUCTIONS', 'CONTEXT', 'BUILD', 'USERMANUAL', 'METHODOLOGY', 'INBOX')
    )
);

create unique index if not exists uq_elzos_docs_sections_live_heading
    on elzos.docs_sections (doc_slug, heading)
    where is_current = true;

create index if not exists idx_elzos_docs_sections_slug_position
    on elzos.docs_sections (doc_slug, position)
    where is_current = true;

create index if not exists idx_elzos_docs_sections_updated_at
    on elzos.docs_sections (updated_at desc);

create table if not exists elzos.docs_section_versions (
    id           uuid primary key default gen_random_uuid(),
    section_id   uuid not null references elzos.docs_sections(id) on delete cascade,
    doc_slug     text not null,
    heading      text not null,
    position     integer not null,
    content      text not null,
    version      integer not null,
    updated_by   text,
    captured_at  timestamptz not null default now(),
    captured_by  text,
    unique (section_id, version)
);

create index if not exists idx_elzos_docs_versions_section_version
    on elzos.docs_section_versions (section_id, version desc);
