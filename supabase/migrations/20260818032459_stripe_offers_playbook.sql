-- SPR-110: extend stripe_offers with data-driven anchor + amount + currency
-- columns so /playbook can render the S$119 → S$9 anchor without JSX literals,
-- and seed the Playbook offer with SPR-109's live Stripe identifiers.

alter table public.stripe_offers
  add column if not exists anchor_amount integer,
  add column if not exists unit_amount integer,
  add column if not exists currency text not null default 'sgd';

comment on column public.stripe_offers.anchor_amount is
  'Struck-through anchor price in the smallest currency unit (e.g. 11900 = S$119.00). Null when no anchor.';
comment on column public.stripe_offers.unit_amount is
  'Current sale price in the smallest currency unit (e.g. 900 = S$9.00). Mirror of Stripe Price.unit_amount for display.';

-- Seed the Playbook offer (idempotent on slug).
insert into public.stripe_offers (
  slug, name, description, stripe_price_id, price_display, billing_period,
  features, highlight, active, sort_order, anchor_amount, unit_amount, currency
) values (
  'playbook-lifetime-v1',
  'The Solopreneur''s AI Playbook — Lifetime Access',
  'One playbook. Two pillars — Mindset and Skillset. Lifetime access including every future update.',
  'price_1U5cUMPA71qp9sGSRImagJSQ',
  'S$9',
  'one_off',
  '["Mindset chapters — how solopreneurs actually think about AI", "Skillset chapters — the concrete workflows and prompts", "Archetype-personalised reading order (from the /quiz)", "AI Employee prompt pack and starter templates", "Every future Playbook update, free, for life"]'::jsonb,
  true,
  true,
  1,
  11900,
  900,
  'sgd'
) on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  stripe_price_id = excluded.stripe_price_id,
  price_display = excluded.price_display,
  billing_period = excluded.billing_period,
  features = excluded.features,
  highlight = excluded.highlight,
  active = excluded.active,
  anchor_amount = excluded.anchor_amount,
  unit_amount = excluded.unit_amount,
  currency = excluded.currency,
  updated_at = now();
