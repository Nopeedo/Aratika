-- A saved PARTY POSITION, not a whole topic.
--
-- kind='policy' already exists and means "follow this issue for changes", keyed
-- on the topic alone ('housing'). That is a different thing from "I want this
-- party's position on this issue when I come to decide", which is what the
-- party-position page offers and which had no way to be saved at all.
--
-- ref_id is '<topic>:<party>', e.g. 'housing:national'. One row per reader per
-- position, enforced by the table's existing unique (user_id, kind, ref_id).
--
-- SAVE, NOT LIKE, and private either way. A "like" on a party's policy reads as
-- endorsement on a site whose whole asset is non-partisanship, and a visible
-- count would be a popularity ranking of party policies that nobody asked this
-- site to publish. RLS already restricts every row to its owner, so a saved
-- position is visible to that reader and to nobody else.
--
-- Additive and idempotent, the same shape as 0008 and 0012.
alter table public.bookmarks drop constraint if exists bookmarks_kind_check;

alter table public.bookmarks
  add constraint bookmarks_kind_check
  check (kind in ('mp', 'party', 'electorate', 'policy', 'bill', 'battleground', 'position'));
