-- Fix: logged-out (anon) visitors could not read APPROVED content_items.
--
-- The "editors read all" RLS policy on content_items runs a subquery against
-- public.editors. `editors` only granted SELECT to `authenticated`, so when an
-- anon visitor reads content_items, evaluating that policy raised
-- "permission denied for table editors" and broke the whole read — leaving the
-- public comparison / legislation pages empty for anyone not logged in.
--
-- Granting SELECT on editors to anon is safe: the table's RLS ("editor self read",
-- using auth.uid() = user_id) returns ZERO rows for anon (auth.uid() is null), so
-- the policy subquery simply evaluates to false and the public "read approved"
-- policy applies as intended. No editor data is exposed.

grant select on public.editors to anon;
