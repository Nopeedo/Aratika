-- Separate "battleground" tracking from "electorate" tracking.
--
-- Both the electorate map and the battlegrounds map saved with
-- kind='electorate' and ref_id=<electorate name>, and the table is unique on
-- (user_id, kind, ref_id) — so following Epsom on the map and following the
-- Epsom race were literally the same row. They are different things: one is
-- "this is my seat, who represents me", the other is "this contest is worth
-- watching". They belong in different places in the Command Centre.
--
-- Existing rows can be sorted without guessing, because href records which
-- surface saved them: /battlegrounds/... versus /map?search=...

alter table public.bookmarks drop constraint if exists bookmarks_kind_check;

alter table public.bookmarks
  add constraint bookmarks_kind_check
  check (kind in ('mp', 'party', 'electorate', 'policy', 'bill', 'battleground'));

-- Move the ones that came from the battlegrounds map. Anything without an href,
-- or with a /map href, stays an electorate — the conservative direction, since
-- an electorate that should have been a battleground is merely filed oddly,
-- whereas the reverse would claim someone follows a race they never chose.
update public.bookmarks
   set kind = 'battleground'
 where kind = 'electorate'
   and href like '/battlegrounds/%';
