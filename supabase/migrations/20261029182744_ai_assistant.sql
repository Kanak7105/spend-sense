-- AI assistant: per-user daily usage limit and cached answers.
-- "Today" is Asia/Kolkata, matching the rest of the app, so limits reset at IST midnight.

-- ---------------------------------------------------------------- usage
create table public.ai_usage (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  day date not null default (now() at time zone 'Asia/Kolkata')::date,
  count integer not null default 0 check (count >= 0),
  primary key (user_id, day)
);

alter table public.ai_usage enable row level security;

-- Read-only for users; only consume_ai_credit() writes, so counts can't be reset.
revoke all on public.ai_usage from anon, authenticated;
grant select on public.ai_usage to authenticated;

create policy "ai_usage: select own" on public.ai_usage
  for select to authenticated using (user_id = (select auth.uid()));

-- Uses one credit for the caller today. Returns the new count, or null when the
-- limit is already reached. Atomic: concurrent calls can't exceed the limit.
create or replace function public.consume_ai_credit(p_limit integer)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  used integer;
begin
  if uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  if p_limit is null or p_limit < 1 or p_limit > 100 then
    raise exception 'invalid limit' using errcode = '22023';
  end if;

  insert into public.ai_usage as u (user_id, day, count)
  values (uid, (now() at time zone 'Asia/Kolkata')::date, 1)
  on conflict (user_id, day) do update
    set count = u.count + 1
    where u.count < p_limit
  returning u.count into used;

  return used; -- null when the conflict update was skipped (limit reached)
end;
$$;

revoke execute on function public.consume_ai_credit(integer) from public, anon;
grant execute on function public.consume_ai_credit(integer) to authenticated;

-- ---------------------------------------------------------------- cached answers
create table public.ai_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  prompt_id text not null check (prompt_id ~ '^[a-z0-9-]{1,40}$'),
  period text not null check (period ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  data_hash text not null check (data_hash ~ '^[0-9a-f]{64}$'),
  content text not null check (char_length(content) between 1 and 8000),
  created_at timestamptz not null default now(),
  unique (user_id, prompt_id, period, data_hash)
);

alter table public.ai_responses enable row level security;

revoke all on public.ai_responses from anon, authenticated;
grant select, insert on public.ai_responses to authenticated;

create policy "ai_responses: select own" on public.ai_responses
  for select to authenticated using (user_id = (select auth.uid()));
create policy "ai_responses: insert own" on public.ai_responses
  for insert to authenticated with check (user_id = (select auth.uid()));
