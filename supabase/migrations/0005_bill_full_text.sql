-- Store each bill's cleaned full text for the embedded reader. Kept in its own
-- column (not in data jsonb) so list/editor queries that select `data` don't pull
-- ~150 KB per row. Existing table grants/RLS cover the new column.

alter table public.content_items add column if not exists full_text text;
