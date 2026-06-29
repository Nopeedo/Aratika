-- Content pipeline + editorial review.
--
-- The daily ingest writes everything it pulls from the official APIs into
-- `content_items` as status='pending'. Nothing is shown on the public site until
-- a member of the editorial team (an `editors` row) reviews it, adjusts the
-- plain-language summary to read factually and neutrally, and approves it.

create table if not exists public.content_items (
  id           uuid primary key default gen_random_uuid(),
  type         text not null,                 -- 'bill' | 'members_bill' | 'mp_activity' | ...
  source_id    text not null,                 -- official id/key, for dedupe on re-pull
  title        text not null,                 -- factual, from the source
  data         jsonb not null default '{}',   -- structured factual fields from the API
  summary      text,                          -- plain-language, neutral — editor-checked
  status       text not null default 'pending', -- pending | approved | rejected
  change_kind  text not null default 'new',   -- new | updated
  source_url   text,
  fetched_at   timestamptz default now(),
  reviewed_by  uuid references auth.users (id),
  reviewed_at  timestamptz,
  editor_notes text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now(),
  unique (type, source_id)
);

create index if not exists content_items_status_idx on public.content_items (status);
create index if not exists content_items_type_idx on public.content_items (type);

-- Editorial team allowlist. Add a person by inserting their auth user id:
--   insert into public.editors (user_id, email) values ('<uuid>', 'name@aratika.nz');
create table if not exists public.editors (
  user_id  uuid primary key references auth.users (id) on delete cascade,
  email    text,
  added_at timestamptz default now()
);

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table public.content_items enable row level security;
alter table public.editors enable row level security;

-- The public can read ONLY approved items.
drop policy if exists "public read approved" on public.content_items;
create policy "public read approved" on public.content_items
  for select using (status = 'approved');

-- Editors can read everything (incl. pending) and update (approve/edit/reject).
drop policy if exists "editors read all" on public.content_items;
create policy "editors read all" on public.content_items
  for select using (exists (select 1 from public.editors e where e.user_id = auth.uid()));

drop policy if exists "editors update" on public.content_items;
create policy "editors update" on public.content_items
  for update using (exists (select 1 from public.editors e where e.user_id = auth.uid()))
  with check (exists (select 1 from public.editors e where e.user_id = auth.uid()));

-- A user can see their own editor row (so the app can check "am I an editor?").
drop policy if exists "editor self read" on public.editors;
create policy "editor self read" on public.editors
  for select using (auth.uid() = user_id);

-- Inserts from the ingest job use the service role, which bypasses RLS.
grant select on public.content_items to anon, authenticated;
grant update on public.content_items to authenticated;
grant all on public.content_items to service_role;
grant select on public.editors to authenticated;
grant all on public.editors to service_role;
