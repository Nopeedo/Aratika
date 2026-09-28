-- 0017_welcome_email.sql — remember who has already been welcomed.
--
-- The welcome email needs exactly one fact per user: has it been sent. That
-- cannot live in a committed state file the way the bill and policy detectors
-- do their dedup — this repo is PUBLIC, and a file listing which accounts exist
-- is a list of the site's users, which is not ours to publish.
--
-- Nullable rather than a boolean default false, so the timestamp doubles as the
-- record of WHEN. A null means never sent; a date means sent and when, which is
-- the question anyone debugging a "did this person get it" report will ask.

alter table public.notification_prefs
  add column if not exists welcome_sent_at timestamptz;

comment on column public.notification_prefs.welcome_sent_at is
  'When the one-off welcome email was sent. Null = never sent. Set by scripts/welcome-email.mjs.';

-- Partial index: the sender only ever asks "who has NOT been welcomed", and
-- once the site is live the answer is a handful of rows out of everyone. A
-- partial index stays the size of the backlog rather than the user table.
create index if not exists notification_prefs_welcome_pending_idx
  on public.notification_prefs (user_id)
  where welcome_sent_at is null;

-- No RLS policy change. The existing "own notification prefs - select" policy
-- lets a user read their own row, which now includes this timestamp; that is
-- harmless and arguably correct. Only the service role writes it.
