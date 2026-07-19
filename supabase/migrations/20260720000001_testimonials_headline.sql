-- Curated one-liner summary for testimonial cards. Never replaces the
-- author's raw quote / quote_answers — it's an editorial title layered on top.
alter table testimonials add column if not exists headline text;
comment on column testimonials.headline is 'One-liner summary curated by admin/Claude — NEVER modifies the raw quote/quote_answers. Displayed as card title on /testimonials.';
