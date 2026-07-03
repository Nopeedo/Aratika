-- Command Centre Phase B — allow tracking BILLS.
-- Widen the bookmarks.kind CHECK to include 'bill'. Additive and idempotent:
-- drop the existing constraint (name is auto-generated as <table>_<col>_check)
-- and re-add it with the extra value. Anonymous bill tracking already works
-- client-side (localStorage); this lets signed-in bills persist too.

alter table public.bookmarks drop constraint if exists bookmarks_kind_check;

alter table public.bookmarks
  add constraint bookmarks_kind_check
  check (kind in ('mp', 'party', 'electorate', 'policy', 'bill'));
