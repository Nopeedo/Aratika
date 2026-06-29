-- Personal highlights + notes on bill text (Step 4b). Each row is one user's
-- highlight of a passage, with an optional note. Private to the user (RLS).

create table if not exists public.bill_annotations (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  content_item_id uuid not null references public.content_items (id) on delete cascade,
  bill_slug       text,
  bill_title      text,
  paragraph_index integer not null default 0,   -- which paragraph the quote is in
  quote           text not null,                -- the highlighted passage
  note            text,                         -- optional note
  created_at      timestamptz default now()
);

create index if not exists bill_annotations_user_idx on public.bill_annotations (user_id);
create index if not exists bill_annotations_item_idx on public.bill_annotations (content_item_id);

alter table public.bill_annotations enable row level security;

-- Users can do anything with their OWN annotations, nothing with anyone else's.
drop policy if exists "own annotations" on public.bill_annotations;
create policy "own annotations" on public.bill_annotations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant all on public.bill_annotations to authenticated;
grant all on public.bill_annotations to service_role;
