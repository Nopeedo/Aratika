-- 0009_push_notifications.sql
-- Web Push subscriptions + per-user notification preferences.
--
-- push_subscriptions: one row per browser/device a user has opted in on (a user
--   can have several — phone, laptop). Stores the W3C PushSubscription fields.
-- notification_prefs: one row per user — master toggles for push and the email
--   digest, plus a stable unsubscribe token used by the one-click email
--   unsubscribe link (checked server-side with the service role).

-- ── Push subscriptions ────────────────────────────────────────────────────────
create table if not exists public.push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  endpoint    text not null,
  p256dh      text not null,
  auth        text not null,
  user_agent  text,
  created_at  timestamptz not null default now(),
  last_seen   timestamptz not null default now(),
  unique (endpoint)
);

create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

-- A user can see, add and remove only their own subscriptions.
create policy "own push subscriptions - select" on public.push_subscriptions
  for select using (auth.uid() = user_id);
create policy "own push subscriptions - insert" on public.push_subscriptions
  for insert with check (auth.uid() = user_id);
create policy "own push subscriptions - update" on public.push_subscriptions
  for update using (auth.uid() = user_id);
create policy "own push subscriptions - delete" on public.push_subscriptions
  for delete using (auth.uid() = user_id);

-- ── Notification preferences ──────────────────────────────────────────────────
create table if not exists public.notification_prefs (
  user_id               uuid primary key references auth.users(id) on delete cascade,
  push_enabled          boolean not null default false,   -- opt-in: on once they grant permission
  email_digest_enabled  boolean not null default true,    -- newsletter on by default; one-click unsubscribe
  unsubscribe_token     uuid not null default gen_random_uuid(),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (unsubscribe_token)
);

alter table public.notification_prefs enable row level security;

create policy "own notification prefs - select" on public.notification_prefs
  for select using (auth.uid() = user_id);
create policy "own notification prefs - insert" on public.notification_prefs
  for insert with check (auth.uid() = user_id);
create policy "own notification prefs - update" on public.notification_prefs
  for update using (auth.uid() = user_id);

-- Note: the digest/newsletter sender runs server-side with the service role
-- (bypasses RLS), the same pattern as the existing submission-alert job. RLS
-- above only governs what a logged-in user can do to their OWN rows from the app.
