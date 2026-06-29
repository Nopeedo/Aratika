-- Ask Aratika — per-user daily usage, to enforce the free daily limit.

create table if not exists public.companion_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  count integer not null default 0,
  primary key (user_id, day)
);

alter table public.companion_usage enable row level security;

-- Users can read their own usage (to show "X left today"); writes go through the
-- service role / the security-definer function below.
drop policy if exists "own usage read" on public.companion_usage;
create policy "own usage read" on public.companion_usage
  for select using (auth.uid() = user_id);

grant select on public.companion_usage to authenticated;
grant all on public.companion_usage to service_role;

-- Atomic increment — returns the new count for the day.
create or replace function public.increment_companion_usage(p_user uuid, p_day date)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare new_count integer;
begin
  insert into public.companion_usage (user_id, day, count)
  values (p_user, p_day, 1)
  on conflict (user_id, day)
  do update set count = public.companion_usage.count + 1
  returning count into new_count;
  return new_count;
end;
$$;

grant execute on function public.increment_companion_usage(uuid, date) to service_role;
