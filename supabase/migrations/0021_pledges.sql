-- Pledges to vote.
--
-- WHAT THIS TABLE IS, AND IS NOT. A row here means one person tapped "I'm
-- voting" on politika.nz. It is not a record that anyone voted, and it is not a
-- record that anyone enrolled. There is no way to learn either: the Electoral
-- Commission's enrolment flow runs on a separate origin behind a bot challenge,
-- sends no callback, exposes no API, and electoral data goes only to the narrow
-- classes named in the Electoral Act 1993 (ss 111D, 112A, 113, 114) — a civic
-- website is not one of them. Anything built on this table must therefore say
-- "pledged", never "enrolled" and never "voted".
--
-- WHY TWO DEDUP KEYS. Neither alone is enough and they do different jobs:
--
--   user_id      one pledge per account, email-verified by Supabase auth. This
--                is the subset the site can defend when someone asks how the
--                number was counted, so it is reported separately.
--   device_token an httpOnly cookie minted on first pledge. Catches the honest
--                repeat — the same person tapping twice, or coming back next
--                week having forgotten. Trivially defeated by clearing site
--                data, and that is fine: a determined person adding one pledge
--                is not the threat.
--
-- DELIBERATELY NOT HERE: no raw IP, and no device fingerprint. ip_hash is
-- salted and exists only to rate-limit scripted inflation. A hard one-per-IP
-- rule would be worse than useless — New Zealand mobile networks run CGNAT, so
-- a marae, a school or a workplace shares one address, and the rejections would
-- fall hardest on exactly the people this campaign is for.
create table if not exists public.pledges (
  id           uuid        primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),

  -- Null for an anonymous pledge. ON DELETE SET NULL, not CASCADE: someone
  -- deleting their account should not silently decrement a public total they
  -- were counted in, and the pledge itself carries nothing personal.
  user_id      uuid        references auth.users (id) on delete set null,

  -- The anonymous dedup key. Null once a pledge has been claimed by an account.
  device_token uuid,

  -- Answered on the screen after the pledge: 'yes' | 'no' | 'unknown'.
  -- Null means they pledged and closed the card before answering, which is a
  -- real outcome and must stay distinguishable from 'unknown' (they answered,
  -- and the answer was that they do not know).
  enrolled     text        check (enrolled in ('yes', 'no', 'unknown')),

  -- Salted hash, for rate limiting only. Never the address itself.
  ip_hash      text,

  -- Where the pledge was made, so a surface that converts badly can be found
  -- rather than guessed at.
  source       text
);

-- One pledge per account, and one per browser. Partial indexes so the many
-- anonymous rows with a null user_id do not collide with each other.
create unique index if not exists pledges_user_idx
  on public.pledges (user_id) where user_id is not null;
create unique index if not exists pledges_device_idx
  on public.pledges (device_token) where device_token is not null;

-- The rate-limit lookup: "how many from this hash in the last hour".
create index if not exists pledges_ip_recent_idx
  on public.pledges (ip_hash, created_at) where ip_hash is not null;

-- RLS on with no policy: written and read by the service role only, through
-- /api/pledge. No browser touches this table directly, so a missing policy is a
-- denial rather than an oversight.
alter table public.pledges enable row level security;

-- The grant is NOT implied by RLS, and this project has been bitten twice.
-- 0009 and 0010 created tables with policies and no grants and notifications
-- were dead for 40 runs; 0015 repeated it. With no grant, every role is refused
-- at the table before RLS is ever consulted.
grant all on public.pledges to service_role;
