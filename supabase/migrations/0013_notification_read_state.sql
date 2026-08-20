-- 0013_notification_read_state.sql
--
-- Makes notification_queue readable as an INBOX rather than only a send queue.
--
-- Every alert already stores its title, body, category, timestamp and
-- destination URL, and 0010 added a select policy for the owner with the comment
-- "future in-app inbox". Nothing ever read it: push was the only delivery, so
-- missing a notification — or being on a device without push — lost the update
-- permanently. The red dot on the dashboard is a localStorage guess that knows
-- something changed but not what, and cannot link to it.
--
-- read_at is nullable and only ever set by the owner. Nothing back-fills it:
-- everything already delivered stays unread on first load, which is honest —
-- the reader genuinely has not seen these in an inbox before.

alter table public.notification_queue
  add column if not exists read_at timestamptz;

-- The inbox query: this user's notifications, newest first, and the unread
-- count for the badge. Partial index because unread is the hot path and the
-- read rows accumulate indefinitely.
create index if not exists notification_queue_inbox_idx
  on public.notification_queue (user_id, created_at desc);

create index if not exists notification_queue_unread_idx
  on public.notification_queue (user_id)
  where read_at is null;

-- The owner may mark their own notifications read. That is the only column they
-- may change, so the policy is paired with a trigger that rejects edits to
-- anything else — without it, "for update using (auth.uid() = user_id)" would
-- let a user rewrite the title and url of their own rows.
drop policy if exists "own notifications - mark read" on public.notification_queue;
create policy "own notifications - mark read" on public.notification_queue
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.notification_queue_read_only_read_at()
returns trigger language plpgsql as $$
begin
  if auth.uid() is not null and auth.uid() = old.user_id then
    if (new.user_id, new.urgency, new.category, new.dedup_key, new.title,
        new.body, new.url, new.created_at, new.sent_at, new.channels)
       is distinct from
       (old.user_id, old.urgency, old.category, old.dedup_key, old.title,
        old.body, old.url, old.created_at, old.sent_at, old.channels) then
      raise exception 'only read_at may be changed';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists notification_queue_guard on public.notification_queue;
create trigger notification_queue_guard
  before update on public.notification_queue
  for each row execute function public.notification_queue_read_only_read_at();
