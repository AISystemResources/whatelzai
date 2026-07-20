-- Curated per-testimonial keyword tags (character, capabilities, impact words).
-- Aggregated across published rows for the /testimonials header, and shown as
-- pill tags on the individual testimonial page. Kept simple as TEXT[] so
-- aggregation is a single unnest+group-by SQL query.
alter table testimonials add column if not exists keywords text[] not null default '{}';
comment on column testimonials.keywords is 'Character/capability/impact keyword tags curated per testimonial. Distinct from headline (phrasal). Aggregated across published rows for site-wide "words people use about Edmund" display.';

-- Index for the unnest aggregation query.
create index if not exists testimonials_keywords_gin on testimonials using gin (keywords);
