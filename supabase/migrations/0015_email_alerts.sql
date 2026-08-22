-- 0015_email_alerts.sql
--
-- Remember which alert emails have actually been sent.
--
-- alert-submission-emails.mjs deduped against scripts/.state/submission-alerts.json,
-- a file the ingest workflow committed back to the repo after each run. Whether a
-- real person got emailed twice therefore depended on a `git pull --rebase && git
-- push` succeeding inside CI, racing every other workflow that pushes to main.
--
-- It did not succeed. A submission alert went out on 21 August 2026 and the state
-- file exists nowhere — not in the repo, not on origin/main — so the next run
-- would have sent the same email again, and the run after that, indefinitely.
--
-- The queue solved this properly three migrations ago with a unique
-- (user_id, dedup_key). This gives the email path the same guarantee: the claim
-- is the insert, so two concurrent runs cannot both win, and nothing depends on
-- a later write landing anywhere.
--
-- Deliberately NOT notification_queue. Rows there surface in the dashboard as
-- unread items, and detect-submissions.mjs already enqueues one per submission
-- window. Recording the email there would double every entry a reader sees.

create table if not exists public.email_alerts (
  user_id    uuid        not null references auth.users(id) on delete cascade,
  dedup_key  text        not null,   -- e.g. bill_submission:bill-members-2026-302
  kind       text        not null,   -- which alert job wrote this
  sent_at    timestamptz not null default now(),
  primary key (user_id, dedup_key)
);

-- RLS on with no policy at all: this is a send ledger, written and read only by
-- the service role. Clients have no reason to see it, and a missing policy is a
-- denial rather than an oversight.
alter table public.email_alerts enable row level security;

comment on table public.email_alerts is
  'One row per alert email actually sent. The primary key is the send lock — claim before sending, delete the claim if the send throws.';
comment on column public.email_alerts.dedup_key is
  'Stable per-event key. Bill submissions key on the bill slug ALONE, not the closing date: a corrected close date must not re-email everyone tracking that bill.';
