-- Pledges gain a name and an email.
--
-- A pledge used to be a tap. It is now a short form, which changes what this
-- table holds and therefore what the privacy policy has to say. Three separate
-- consents live here and they must never be collapsed into one:
--
--   1. giving an email          — required, and the basis for dedup
--   2. showing a name publicly  — OPT IN, default false
--   3. being emailed            — OPT IN, default false, separate from (2)
--
-- Someone handing over an address to register a pledge has not agreed to be
-- mailed, and has not agreed to appear on a public list. The Unsolicited
-- Electronic Messages Act 2007 wants express consent and a live unsubscribe for
-- (3); (2) is a political participation record under a real name and deserves
-- the same deliberateness.
--
-- WHAT IS PUBLISHED. Only "First L." — a first name and a surname initial —
-- and only when display_name is true. The stored name is never rendered in
-- full and the email is never rendered at all, under any setting. A public
-- list of named people who pledged to vote is permanent and scrapeable, and
-- for some readers (someone leaving an abusive relationship, someone whose
-- employer has views) being on it is a real cost they cannot undo.
alter table public.pledges
  add column if not exists name          text,
  add column if not exists email         text,
  -- Opt in to appearing on the public wall. Default false: silence must never
  -- be read as permission.
  add column if not exists display_name  boolean not null default false,
  -- Opt in to the newsletter. Separate consent, separate column, so neither can
  -- be inferred from the other.
  add column if not exists newsletter    boolean not null default false;

-- One pledge per email address. This is the dedup that actually holds: the
-- device cookie is defeated by a private window, an email is not. Partial, so
-- the rows that predate this migration (and any future anonymous-by-cookie
-- row) do not collide on null.
--
-- Stored lower-cased by the route, so the index is effectively case-insensitive
-- without needing citext.
create unique index if not exists pledges_email_idx
  on public.pledges (email) where email is not null;

-- The public wall reads "most recent, opted in, has a name". Indexed so that
-- stays cheap as the table grows — this is the one query a visitor triggers.
create index if not exists pledges_wall_idx
  on public.pledges (created_at desc) where display_name = true and name is not null;
