-- 0011_notification_grants.sql
--
-- Fix: notifications never worked. Nobody could subscribe, and the sender job
-- failed on all 40 of its scheduled runs with "permission denied for table
-- notification_queue".
--
-- 0009 and 0010 created the three notification tables with RLS policies but no
-- GRANTs. Those are different things, and the comment in 0009 conflated them:
-- it noted the sender "runs with the service role (bypasses RLS)" and stopped
-- there. Bypassing RLS does not grant table privileges. With no GRANT, every
-- role — service_role included — is refused at the table before RLS is ever
-- consulted.
--
-- It broke both ends at once:
--   * push_subscriptions / notification_prefs had no grant to `authenticated`,
--     so /api/push/subscribe returned 500 and no subscription was ever stored.
--   * notification_queue had no grant to `service_role`, so the detection jobs
--     could not enqueue and send-notifications.mjs crashed on startup.
--
-- 0007_bookmarks.sql got this right and is the pattern followed here — which is
-- why bookmarks works and these did not.
--
-- notification_queue stays SELECT-only for `authenticated`: 0010's RLS allows a
-- user to read their own rows for a future in-app inbox, and all writes are
-- server-side.

grant all    on public.push_subscriptions to authenticated;
grant all    on public.push_subscriptions to service_role;

grant all    on public.notification_prefs to authenticated;
grant all    on public.notification_prefs to service_role;

grant select on public.notification_queue to authenticated;
grant all    on public.notification_queue to service_role;
