-- SPR-111: durable entitlements for one-off purchases (Playbook), keyed on
-- Stripe event id for idempotency. Tolerant of pre-signup buyers — user_id
-- is nullable and stitched later (SPR-112) via customer_email match.

create table if not exists public.entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id text,
  stripe_customer_id text not null,
  customer_email text not null,
  product_slug text not null,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  stripe_event_id text not null unique,
  stripe_checkout_session_id text,
  stripe_charge_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_entitlements_user_product_active
  on public.entitlements (user_id, product_slug)
  where revoked_at is null;

create index if not exists idx_entitlements_email_product
  on public.entitlements (lower(customer_email), product_slug);

create index if not exists idx_entitlements_charge
  on public.entitlements (stripe_charge_id)
  where stripe_charge_id is not null;

comment on table public.entitlements is
  'Persistent access grants keyed on Stripe event id (idempotent). user_id nullable to accept pre-signup one-off buyers; stitched via customer_email on Clerk signup.';
comment on column public.entitlements.revoked_at is
  'Soft revocation timestamp. Never delete rows — refund audit trail. Refund-then-repurchase creates a new row, does not un-revoke the old one.';

alter table public.entitlements enable row level security;

-- Users see only their own active grants. Service role bypasses RLS.
create policy entitlements_owner_read
  on public.entitlements for select
  using (auth.jwt() ->> 'sub' = user_id);

-- ── webhook_events_log ─────────────────────────────────────────────
-- Append-only receipt log. Backs /api/health/stripe's last_webhook_at
-- freshness signal and gives a debug trail without hitting the Stripe API.
create table if not exists public.webhook_events_log (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text not null unique,
  event_type text not null,
  received_at timestamptz not null default now(),
  processed_ok boolean not null default false,
  error_msg text
);

create index if not exists idx_webhook_events_received_at
  on public.webhook_events_log (received_at desc);

alter table public.webhook_events_log enable row level security;
-- No policies — service-role-only. Nothing user-facing here.
