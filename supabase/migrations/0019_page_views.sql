-- First-party page-view analytics, read on /editor/analytics.
--
-- Vercel Analytics already runs (layout.tsx) but its numbers live in the
-- Vercel dashboard, not in the admin. This is the admin's own count.
--
-- One row per page view. What is NOT stored, on purpose (the FAQ promises
-- "privacy-respecting analytics"): no IP address, no user agent, no account id,
-- no query string (reset-password and confirm links carry tokens in theirs).
--   visitor_id  random uuid kept in the browser's localStorage: one per browser,
--               so "visitors" counts browsers, not people.
--   session_id  random uuid kept in sessionStorage: one per tab session, so a
--               "visit" is one sitting, however many pages it covers.
--   referrer_host  only the other site's host name, and only on the first page
--               of a visit (later pages would just say politika.nz).
--   device      'mobile' | 'tablet' | 'desktop', derived from the user agent on
--               the server and then the user agent is dropped.
create table if not exists public.page_views (
  id            bigint generated always as identity primary key,
  created_at    timestamptz not null default now(),
  path          text        not null,
  visitor_id    uuid,
  session_id    uuid,
  referrer_host text,
  device        text
);

create index if not exists page_views_created_at_idx on public.page_views (created_at desc);
create index if not exists page_views_path_created_at_idx on public.page_views (path, created_at desc);

-- RLS on with no policy: written by /api/track and read by /editor/analytics,
-- both through the service role. No browser reads or writes this directly.
alter table public.page_views enable row level security;

-- The grant is not implied by RLS (see 0018's note: tables with no grant were
-- silently refused for 40 runs).
grant all on public.page_views to service_role;

-- ── Reports ─────────────────────────────────────────────────────────────────
-- Counting happens in the database, so the admin page never pulls raw rows.
-- `days` is the window in New Zealand days: 1 = today so far, 7 = today and
-- the six days before, null = all time.

create or replace function public.page_view_since(days int)
returns timestamptz
language sql stable
as $$
  select case
    when days is null then '-infinity'::timestamptz
    else (date_trunc('day', now() at time zone 'Pacific/Auckland') - (days - 1) * interval '1 day')
         at time zone 'Pacific/Auckland'
  end
$$;

-- Page views, unique visitors, and visits (sessions) in the window.
create or replace function public.page_view_totals(days int)
returns table (views bigint, visitors bigint, visits bigint)
language sql stable
as $$
  select count(*), count(distinct visitor_id), count(distinct session_id)
  from public.page_views
  where created_at >= public.page_view_since(days)
$$;

-- Every page in the window, most viewed first.
create or replace function public.page_view_by_path(days int, max_rows int default 500)
returns table (path text, views bigint, visitors bigint)
language sql stable
as $$
  select path, count(*) as views, count(distinct visitor_id) as visitors
  from public.page_views
  where created_at >= public.page_view_since(days)
  group by path
  order by views desc, path
  limit max_rows
$$;

-- One row per New Zealand day in the window that had any views.
create or replace function public.page_view_daily(days int)
returns table (day date, views bigint, visitors bigint, visits bigint)
language sql stable
as $$
  select (created_at at time zone 'Pacific/Auckland')::date as day,
         count(*), count(distinct visitor_id), count(distinct session_id)
  from public.page_views
  where created_at >= public.page_view_since(days)
  group by day
  order by day
$$;

-- Where visits came from: first-page referrer hosts in the window.
create or replace function public.page_view_referrers(days int, max_rows int default 20)
returns table (referrer_host text, visits bigint)
language sql stable
as $$
  select referrer_host, count(distinct session_id) as visits
  from public.page_views
  where created_at >= public.page_view_since(days) and referrer_host is not null
  group by referrer_host
  order by visits desc, referrer_host
  limit max_rows
$$;

-- Service role only. Supabase grants EXECUTE on new functions to anon and
-- authenticated by default, which would let any browser read the counts.
revoke execute on function public.page_view_since(int)              from public, anon, authenticated;
revoke execute on function public.page_view_totals(int)             from public, anon, authenticated;
revoke execute on function public.page_view_by_path(int, int)       from public, anon, authenticated;
revoke execute on function public.page_view_daily(int)              from public, anon, authenticated;
revoke execute on function public.page_view_referrers(int, int)     from public, anon, authenticated;
grant  execute on function public.page_view_since(int)              to service_role;
grant  execute on function public.page_view_totals(int)             to service_role;
grant  execute on function public.page_view_by_path(int, int)       to service_role;
grant  execute on function public.page_view_daily(int)              to service_role;
grant  execute on function public.page_view_referrers(int, int)     to service_role;
