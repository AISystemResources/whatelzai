-- Stripe integration — offers catalog + user subscription state.
-- Offers = editable product catalog (name, description, stripe price id per row).
-- Subscriptions = per-user Stripe state, kept in sync via webhook.

-- ── stripe_offers ──────────────────────────────────────────────────
create table if not exists public.stripe_offers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  stripe_price_id text,
  price_display text not null,
  billing_period text not null check (billing_period in ('recurring', 'one_off')),
  features jsonb,
  highlight boolean not null default false,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_stripe_offers_active_sort
  on public.stripe_offers (active, sort_order);

comment on column public.stripe_offers.stripe_price_id is
  'Stripe Price ID (price_...). May be null while offer is being drafted.';
comment on column public.stripe_offers.price_display is
  'Human-readable price string, e.g. "$50/month" — decouples display from Stripe amount.';

-- ── subscriptions ──────────────────────────────────────────────────
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  clerk_id text not null,
  stripe_customer_id text not null,
  stripe_subscription_id text not null unique,
  stripe_price_id text not null,
  offer_id uuid references public.stripe_offers(id) on delete set null,
  status text not null,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_subscriptions_clerk_id
  on public.subscriptions (clerk_id);
create index if not exists idx_subscriptions_customer
  on public.subscriptions (stripe_customer_id);
create index if not exists idx_subscriptions_status
  on public.subscriptions (status);

comment on table public.subscriptions is
  'Mirror of Stripe subscription state. Source of truth for gating access.';
comment on column public.subscriptions.status is
  'Stripe subscription status: active, trialing, past_due, canceled, incomplete, incomplete_expired, unpaid, paused.';

-- ── Seed the v1 membership offer ───────────────────────────────────
-- stripe_price_id left null; admin fills once Stripe product exists.
insert into public.stripe_offers (
  slug, name, description, price_display, billing_period,
  features, highlight, sort_order
) values (
  'whatelz-membership',
  'whatelz.ai Membership',
  'Members-only access to the whatelz.ai learning library — quizzes, videos, e-books, and podcasts. New content every month.',
  '$50 / month',
  'recurring',
  '["Quizzes I built to test what I actually know", "Videos of me explaining AI systems and building in public", "E-books and long-form playbooks", "Podcast episodes and interviews"]'::jsonb,
  true,
  0
) on conflict (slug) do nothing;

-- ── RLS ────────────────────────────────────────────────────────────
-- Both tables are server-only (no client reads via anon key).
alter table public.stripe_offers enable row level security;
alter table public.subscriptions enable row level security;

-- Public read of active offers (for /services + /members pitch page).
create policy stripe_offers_public_read
  on public.stripe_offers for select
  using (active = true);

-- Subscriptions: no anon access at all. Server queries go via service role.
-- (No policy = deny for authenticated/anon; service role bypasses RLS.)
