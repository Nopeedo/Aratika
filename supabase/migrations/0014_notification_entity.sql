-- 0014_notification_entity.sql
--
-- Record WHICH tracked thing caused each notification.
--
-- A queue row currently knows its category ("news") but not its subject. The
-- detectors know: detect-content matches an item's tags against a user's
-- bookmarks and enqueues inside that loop, holding the kind and ref_id at the
-- moment it writes. It simply never stored them.
--
-- Without this, the dashboard cannot say "3 updates on Shane Jones" — only that
-- something, somewhere, changed. That is the red dot's whole problem: it knows
-- something moved and can neither name it nor link to it.
--
-- Nullable, and nothing is back-filled. The 202 existing rows keep a null entity
-- and simply do not contribute to any per-tile count, which is honest — we
-- genuinely cannot reconstruct which bookmark matched them after the fact.

alter table public.notification_queue
  add column if not exists entity_kind text,
  add column if not exists entity_ref  text;

-- The dashboard query: unread, for this user, grouped by tracked item. Partial
-- on unread because that is the hot path and read rows accumulate forever.
create index if not exists notification_queue_entity_idx
  on public.notification_queue (user_id, entity_kind, entity_ref)
  where read_at is null;

-- Kinds match the bookmarks constraint (0012). Left permissive rather than a
-- CHECK: a detector inventing a kind should show up as an unmatched tile in
-- review, not as a failed insert that loses the notification entirely.
comment on column public.notification_queue.entity_kind is
  'mp | party | electorate | policy | bill | battleground — matches bookmarks.kind';
comment on column public.notification_queue.entity_ref is
  'The bookmark ref_id this notification is about.';
