-- Aratika Learn — per-user progress.
-- Run this once in the Supabase SQL editor (or via `supabase db push`).
-- Until it exists, the app falls back silently to localStorage-only progress.

create table if not exists public.learn_progress (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  module_id   text not null,
  tier        text not null check (tier in ('kids','beginner','intermediate','expert')),
  score       integer not null default 0,
  total       integer not null default 0,
  updated_at  timestamptz not null default now(),
  unique (user_id, module_id, tier)
);

alter table public.learn_progress enable row level security;

-- Each user can only see and write their own rows.
create policy "learn_progress_select_own"
  on public.learn_progress for select
  using (auth.uid() = user_id);

create policy "learn_progress_insert_own"
  on public.learn_progress for insert
  with check (auth.uid() = user_id);

create policy "learn_progress_update_own"
  on public.learn_progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists learn_progress_user_idx on public.learn_progress (user_id);
