-- Ask Arapono — a SITE-WIDE daily question total, so spend has a ceiling.
--
-- 0003 gave every user a 15/day limit. That bounds one person and nothing else:
-- the cap is per user, so the site's exposure is 15 x however many accounts
-- exist. At ten thousand accounts that is 150,000 questions a day, which on
-- current token sizes is roughly USD 2,000 a day. Nothing in the code stopped
-- it, and the way anyone would have found out is a card statement.
--
-- Summing the day's rows in the application would mean fetching one row per
-- person who asked anything today, on every request, purely to add them up.
-- This does the arithmetic in Postgres and returns one number.
--
-- STABLE, not VOLATILE: it reads and never writes, so the planner may cache it
-- within a statement. SECURITY DEFINER so the route can call it with the
-- service role without opening companion_usage to anyone else.

create index if not exists companion_usage_day_idx on public.companion_usage (day);

create or replace function public.companion_day_total(p_day date)
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(count), 0)::bigint
  from public.companion_usage
  where day = p_day;
$$;

-- The route calls this with the service role only. Not granted to anon or
-- authenticated: a reader has no business knowing the site's daily spend, and
-- RLS on the table does not apply inside a security-definer function.
revoke all on function public.companion_day_total(date) from public, anon, authenticated;
grant execute on function public.companion_day_total(date) to service_role;
