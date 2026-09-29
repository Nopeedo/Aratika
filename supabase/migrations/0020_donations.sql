-- Donations to Politika, as reported by Onebyone Project.
--
-- Onebyone is the merchant: donors pay on Onebyone's Stripe account, and
-- Onebyone's webhook sends /api/donate/notify a signed note once a payment
-- is paid. This table is Politika's copy of that note, and the queue the
-- receipt job (scripts/donation-receipts.mjs, every 10 minutes) works from:
-- receipt_sent_at null = the donor hasn't had their receipt yet.
--
-- No card details ever reach Politika. What's here is what the receipt
-- needs: amount, donor's email and name from Checkout, and a reference.
create table if not exists public.donations (
  id                bigint generated always as identity primary key,
  -- Stripe Checkout session id on Onebyone's account. Unique so a
  -- redelivered note can't create a second row or a second receipt.
  stripe_session_id text        not null unique,
  reference         text        not null,
  amount_cents      integer     not null check (amount_cents > 0),
  currency          text        not null default 'nzd',
  donor_email       text,
  donor_name        text,
  email_updates     boolean     not null default false,
  cover_fee         boolean     not null default false,
  paid_at           timestamptz,
  received_at       timestamptz not null default now(),
  receipt_sent_at   timestamptz,
  -- Last send failure, kept so a stuck receipt is visible rather than retried
  -- forever in silence.
  receipt_error     text,
  receipt_attempts  integer     not null default 0
);

create index if not exists donations_receipt_queue_idx
  on public.donations (received_at) where receipt_sent_at is null;

-- RLS on with no policy: written by /api/donate/notify and read by the
-- receipt job, both as the service role.
alter table public.donations enable row level security;
grant all on public.donations to service_role;
