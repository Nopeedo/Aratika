-- Bookmarks — the user's "command centre". One row per saved entity (an MP, a
-- party, an electorate, or a policy topic). Free feature, login required. Each
-- row is private to its owner (RLS). A user can bookmark a given entity once.

create table if not exists public.bookmarks (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  kind       text not null check (kind in ('mp', 'party', 'electorate', 'policy')),
  ref_id     text not null,            -- slug/id of the entity (e.g. an MP slug)
  label      text not null,            -- display name, captured at save time
  sublabel   text,                     -- e.g. "MP for Rongotai", "Political party"
  href       text,                     -- where the card links to
  accent     text,                     -- optional accent colour (e.g. party colour)
  created_at timestamptz default now(),
  unique (user_id, kind, ref_id)
);

create index if not exists bookmarks_user_idx on public.bookmarks (user_id);
create index if not exists bookmarks_user_kind_idx on public.bookmarks (user_id, kind);

alter table public.bookmarks enable row level security;

-- Users can do anything with their OWN bookmarks, nothing with anyone else's.
drop policy if exists "own bookmarks" on public.bookmarks;
create policy "own bookmarks" on public.bookmarks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant all on public.bookmarks to authenticated;
grant all on public.bookmarks to service_role;
