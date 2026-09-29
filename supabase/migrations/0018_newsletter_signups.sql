-- Anonymous newsletter signups.
--
-- Every email path in this project so far hangs off auth.users: notification_prefs
-- keys on user_id, email_alerts references auth.users, and /api/newsletter/prefs
-- 401s without a session. That is correct for a reader with an account, and it is
-- the whole story only while the only way to hear from us is to make one.
--
-- The homepage box asks for an email and nothing else. Those people have no
-- account and may never make one, so their address needs somewhere of its own.
--
-- confirmed_at is nullable and starts null: this table records that someone
-- ASKED, not that the address is verified. Nothing should send to a row whose
-- confirmed_at is null until a confirmation step exists (see the route's note).
-- The Unsolicited Electronic Messages Act 2007 wants consent plus a working
-- unsubscribe, and a typo'd address in this table is somebody else's inbox.
create table if not exists public.newsletter_signups (
  email        text        primary key,
  created_at   timestamptz not null default now(),
  confirmed_at timestamptz,
  -- Where on the site they signed up, so a source that converts badly or
  -- attracts junk can be found rather than guessed at.
  source       text,
  -- Token for the confirm and unsubscribe links, minted on insert so both can
  -- be built without a second write.
  token        uuid        not null default gen_random_uuid(),
  unsubscribed_at timestamptz
);

create index if not exists newsletter_signups_token_idx on public.newsletter_signups (token);

-- RLS on with no policy: the table is written and read by the service role only.
-- The signup route uses the service key; no browser touches this directly, so a
-- missing policy is a denial rather than an oversight.
alter table public.newsletter_signups enable row level security;

-- The grant is not implied by RLS. 0009 and 0010 created tables with policies
-- and no grants and notifications were dead for 40 runs; 0015 repeated it. With
-- no grant every role is refused at the table before RLS is consulted.
grant all on public.newsletter_signups to service_role;
