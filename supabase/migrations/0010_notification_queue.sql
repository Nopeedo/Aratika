-- 0010_notification_queue.sql
-- A queue of notifications to deliver. Detection jobs ENQUEUE rows; the sender
-- job processes them (immediate rows go out promptly; digest rows are batched
-- into one push+email per user per day). Decoupling detect-from-send keeps the
-- anti-fatigue guardrails (caps, quiet hours, dedup) in one place.
--
-- Server-only writes: detection + sender run with the service role (bypass RLS).
-- A user may READ their own rows (for a future in-app inbox); no client writes.

create table if not exists public.notification_queue (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  urgency     text not null check (urgency in ('immediate', 'digest')),
  category    text not null,          -- bill_status | bill_submission | news | video | policy | mp | election
  dedup_key   text not null,          -- unique per user+event — prevents double-notify
  title       text not null,
  body        text not null,
  url         text,
  created_at  timestamptz not null default now(),
  sent_at     timestamptz,            -- null = still pending
  channels    text,                   -- e.g. 'push,email' — set when sent
  unique (user_id, dedup_key)
);

-- Fast lookup of a user's still-pending items, by urgency.
create index if not exists notification_queue_pending_idx
  on public.notification_queue (user_id, urgency)
  where sent_at is null;

alter table public.notification_queue enable row level security;

-- Read-only for the owner (future in-app inbox). All writes are service-role.
create policy "own notifications - select" on public.notification_queue
  for select using (auth.uid() = user_id);
