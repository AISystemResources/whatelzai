-- website docs MCP — sections-as-rows with version history
-- Two tables: docs_sections (current state) + docs_section_versions (immutable history)

create table if not exists public.docs_sections (
    id           uuid primary key default gen_random_uuid(),
    doc_slug     text not null,
    heading      text not null,
    position     integer not null,
    content      text not null default '',
    version      integer not null default 1,
    is_current   boolean not null default true,
    created_at   timestamptz not null default now(),
    updated_at   timestamptz not null default now(),
    constraint docs_sections_slug_check check (
        doc_slug in ('IDEAS', 'BUILD', 'CONTEXT', 'INSTRUCTIONS')
    )
);

-- Only one LIVE section per (slug, heading). Soft-deleted rows don't count.
create unique index if not exists uq_docs_sections_live_heading
    on public.docs_sections (doc_slug, heading)
    where is_current = true;

create index if not exists idx_docs_sections_slug_position
    on public.docs_sections (doc_slug, position)
    where is_current = true;

create index if not exists idx_docs_sections_updated_at
    on public.docs_sections (updated_at desc);

-- Immutable history: every mutation snapshots the pre-edit state here
create table if not exists public.docs_section_versions (
    id           uuid primary key default gen_random_uuid(),
    section_id   uuid not null references public.docs_sections(id) on delete cascade,
    doc_slug     text not null,
    heading      text not null,
    position     integer not null,
    content      text not null,
    version      integer not null,
    captured_at  timestamptz not null default now(),
    captured_by  text,
    unique (section_id, version)
);

create index if not exists idx_docs_versions_section_version
    on public.docs_section_versions (section_id, version desc);
