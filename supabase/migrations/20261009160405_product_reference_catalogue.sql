-- Shared product references are read only through authenticated server pages.
-- No client-role grants; service-role credentials never reach the browser.
create table public.product_catalogue_sources (
  id text primary key,
  market text not null check (market in ('MY','SG')),
  currency text not null check ((market='MY' and currency='MYR') or (market='SG' and currency='SGD')),
  title text not null,
  edition_date date not null,
  source_url text not null check (source_url like 'https://%'),
  sha256 text not null check (sha256 ~ '^[a-f0-9]{64}$'),
  retrieved_at timestamptz not null default now(),
  verified_count integer not null check (verified_count >= 0),
  review_queue jsonb not null default '[]' check (jsonb_typeof(review_queue)='array'),
  notes text not null
);
create index product_catalogue_sources_market_date on public.product_catalogue_sources(market, edition_date desc);
create table public.product_catalogue_listings (
  source_id text not null references public.product_catalogue_sources(id),
  sku text not null check (sku ~ '^[0-9]{5,8}[A-Z]?$'),
  name text not null,
  brand text not null,
  category text not null,
  pack text not null default '',
  source_page integer not null check (source_page > 0),
  pv numeric(12,2), pv_max numeric(12,2),
  bv numeric(12,2), bv_max numeric(12,2),
  ap numeric(12,2), ap_max numeric(12,2),
  rp numeric(12,2), rp_max numeric(12,2),
  pv_status text not null, bv_status text not null,
  ap_status text not null, rp_status text not null,
  raw_values jsonb not null,
  primary key (source_id,sku),
  check (pv >= 0 and bv >= 0 and ap >= 0 and rp >= 0),
  check (pv_max >= pv and bv_max >= bv and ap_max >= ap and rp_max >= rp),
  check (pv_status in ('assigned','range','not_applicable','unknown')),
  check (bv_status in ('assigned','range','not_applicable','unknown')),
  check (ap_status in ('assigned','range','not_applicable','unknown')),
  check (rp_status in ('assigned','range','not_applicable','unknown')),
  check ((pv_status in ('assigned','range')) = (pv is not null)),
  check ((bv_status in ('assigned','range')) = (bv is not null)),
  check ((ap_status in ('assigned','range')) = (ap is not null)),
  check ((rp_status in ('assigned','range')) = (rp is not null)),
  check ((pv_status='range') = (pv_max is not null)),
  check ((bv_status='range') = (bv_max is not null)),
  check ((ap_status='range') = (ap_max is not null)),
  check ((rp_status='range') = (rp_max is not null))
);
create table public.product_catalogue_notes (
  id text primary key,
  title text not null,
  body text not null,
  citations jsonb not null check (jsonb_typeof(citations)='array'),
  checked_on date not null
);
alter table public.product_catalogue_sources enable row level security;
alter table public.product_catalogue_listings enable row level security;
alter table public.product_catalogue_notes enable row level security;
revoke all on public.product_catalogue_sources, public.product_catalogue_listings, public.product_catalogue_notes from anon, authenticated;
grant select, insert, update on public.product_catalogue_sources, public.product_catalogue_listings, public.product_catalogue_notes to service_role;
