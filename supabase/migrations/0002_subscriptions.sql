-- Aratika Premium — Stripe subscription state, keyed by Supabase user.
-- Run once in the Supabase SQL editor (or `supabase db push`).
-- Rows are written ONLY by the Stripe webhook (service role); users can read
-- their own row to drive the premium gate.

create table if not exists public.subscriptions (
  user_id                uuid primary key references auth.users (id) on delete cascade,
  stripe_customer_id     text unique,
  stripe_subscription_id text,
  price_id               text,
  status                 text,          -- active | trialing | past_due | canceled | incomplete | ...
  current_period_end     timestamptz,
  updated_at             timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

-- Users may read their own subscription. No insert/update/delete policy:
-- all writes go through the service-role webhook, which bypasses RLS.
create policy "subscriptions_select_own"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create index if not exists subscriptions_customer_idx on public.subscriptions (stripe_customer_id);
