-- Phase 2: aggregation functions for insights, budget progress, recurring
-- transactions and savings-goal top-ups. All callable functions are SECURITY
-- INVOKER, so RLS still limits every query to the caller's own rows.
-- The app is India-first: "today" for scheduling means Asia/Kolkata.

-- ---------------------------------------------------------------- aggregates
create or replace function public.monthly_totals(p_from date, p_to date)
returns table (month date, income numeric, expense numeric)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    date_trunc('month', t.date)::date as month,
    coalesce(sum(t.amount) filter (where t.type = 'income'), 0) as income,
    coalesce(sum(t.amount) filter (where t.type = 'expense'), 0) as expense
  from public.transactions t
  where t.user_id = (select auth.uid()) and t.date between p_from and p_to
  group by 1
  order by 1;
$$;

create or replace function public.daily_totals(p_from date, p_to date)
returns table (day date, income numeric, expense numeric)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    t.date as day,
    coalesce(sum(t.amount) filter (where t.type = 'income'), 0) as income,
    coalesce(sum(t.amount) filter (where t.type = 'expense'), 0) as expense
  from public.transactions t
  where t.user_id = (select auth.uid()) and t.date between p_from and p_to
  group by 1
  order by 1;
$$;

-- Uncategorised rows come back with a null category_id.
create or replace function public.category_totals(
  p_from date,
  p_to date,
  p_type public.transaction_type default 'expense'
)
returns table (category_id uuid, name text, icon text, color text, total numeric)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    c.id,
    coalesce(c.name, 'Uncategorised'),
    coalesce(c.icon, 'tag'),
    coalesce(c.color, '#94a3b8'),
    sum(t.amount)
  from public.transactions t
  left join public.categories c on c.id = t.category_id
  where t.user_id = (select auth.uid())
    and t.type = p_type
    and t.date between p_from and p_to
  group by c.id, c.name, c.icon, c.color
  order by 5 desc;
$$;

-- Totals for the same filters the transactions list uses.
create or replace function public.transaction_totals(
  p_q text default null,
  p_type public.transaction_type default null,
  p_account uuid default null,
  p_category uuid default null,
  p_uncategorized boolean default false,
  p_from date default null,
  p_to date default null
)
returns table (income numeric, expense numeric, tx_count bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    coalesce(sum(t.amount) filter (where t.type = 'income'), 0),
    coalesce(sum(t.amount) filter (where t.type = 'expense'), 0),
    count(*)
  from public.transactions t
  where t.user_id = (select auth.uid())
    and (p_q is null or t.description ilike
      '%' || replace(replace(replace(p_q, '\', '\\'), '%', '\%'), '_', '\_') || '%')
    and (p_type is null or t.type = p_type)
    and (p_account is null or t.account_id = p_account or t.to_account_id = p_account)
    and (p_category is null or t.category_id = p_category)
    and (not p_uncategorized or (t.category_id is null and t.type <> 'transfer'))
    and (p_from is null or t.date >= p_from)
    and (p_to is null or t.date <= p_to);
$$;

-- Each budget with what has been spent in the calendar month containing p_month.
create or replace function public.budget_progress(p_month date)
returns table (
  budget_id uuid,
  category_id uuid,
  name text,
  icon text,
  color text,
  amount numeric,
  spent numeric
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    b.id,
    c.id,
    c.name,
    c.icon,
    c.color,
    b.amount,
    coalesce((
      select sum(t.amount)
      from public.transactions t
      where t.user_id = b.user_id
        and t.category_id = b.category_id
        and t.type = 'expense'
        and t.date >= date_trunc('month', p_month)::date
        and t.date < (date_trunc('month', p_month) + interval '1 month')::date
    ), 0)
  from public.budgets b
  join public.categories c on c.id = b.category_id
  where b.user_id = (select auth.uid())
  order by c.name;
$$;

-- ---------------------------------------------------------------- recurring
-- Smallest occurrence of a schedule strictly after p_after. Monthly/yearly
-- schedules are anchored to start_date, so the 31st stays the 31st where it exists.
create or replace function private.next_occurrence(
  p_start date,
  p_freq public.recurrence_frequency,
  p_interval integer,
  p_after date
)
returns date
language plpgsql
immutable
set search_path = ''
as $$
declare
  step integer;
  n integer;
  candidate date;
begin
  if p_after < p_start then
    return p_start;
  end if;

  if p_freq in ('daily', 'weekly') then
    step := p_interval * case when p_freq = 'daily' then 1 else 7 end;
    n := (p_after - p_start) / step + 1;
    return p_start + n * step;
  end if;

  step := p_interval * case when p_freq = 'monthly' then 1 else 12 end;
  n := ((extract(year from p_after) - extract(year from p_start)) * 12
        + extract(month from p_after) - extract(month from p_start))::integer / step;
  loop
    candidate := (p_start + make_interval(months => n * step))::date;
    exit when candidate > p_after;
    n := n + 1;
  end loop;
  return candidate;
end;
$$;

alter table public.recurring_rules alter column next_run_date set default current_date;

-- next_run_date is always derived: the first occurrence from today (IST) on.
-- Past start dates don't backfill.
create or replace function private.recurring_rules_set_next_run()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  today date := (now() at time zone 'Asia/Kolkata')::date;
begin
  if tg_op = 'INSERT'
     or new.start_date is distinct from old.start_date
     or new.frequency is distinct from old.frequency
     or new.interval_count is distinct from old.interval_count
     or (new.is_active and not old.is_active) then
    new.next_run_date := private.next_occurrence(
      new.start_date, new.frequency, new.interval_count, today - 1);
  end if;
  return new;
end;
$$;

create trigger recurring_rules_set_next_run
  before insert or update on public.recurring_rules
  for each row execute function private.recurring_rules_set_next_run();

-- Creates every due occurrence up to p_today and advances each rule.
-- As a signed-in user it processes only that user's rules (RLS); the cron job
-- calls it with the secret key to process everyone's. SKIP LOCKED makes
-- concurrent calls safe (no duplicate occurrences).
create or replace function public.process_due_recurring(
  p_today date default (now() at time zone 'Asia/Kolkata')::date
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  r public.recurring_rules;
  occ date;
  created integer := 0;
  guard integer;
begin
  for r in
    select * from public.recurring_rules
    where is_active and next_run_date <= p_today
    for update skip locked
  loop
    occ := r.next_run_date;
    guard := 0;
    while occ <= p_today and (r.end_date is null or occ <= r.end_date) and guard < 400 loop
      insert into public.transactions (
        user_id, type, amount, account_id, to_account_id, category_id,
        description, date, recurring_rule_id
      ) values (
        r.user_id, r.type, r.amount, r.account_id, r.to_account_id, r.category_id,
        r.description, occ, r.id
      );
      created := created + 1;
      guard := guard + 1;
      occ := private.next_occurrence(r.start_date, r.frequency, r.interval_count, occ);
    end loop;

    -- Direct column update: the set_next_run trigger only recomputes when the
    -- schedule itself changes, so this value sticks.
    update public.recurring_rules
    set next_run_date = occ,
        last_run_at = now(),
        is_active = (r.end_date is null or occ <= r.end_date)
    where id = r.id;
  end loop;
  return created;
end;
$$;

-- ---------------------------------------------------------------- savings goals
-- Atomic top-up / withdrawal. The saved_amount >= 0 check rejects overdrawing.
create or replace function public.adjust_goal_saved(p_goal_id uuid, p_delta numeric)
returns numeric
language sql
security invoker
set search_path = ''
as $$
  update public.savings_goals
  set saved_amount = saved_amount + round(p_delta, 2)
  where id = p_goal_id
  returning saved_amount;
$$;

-- ---------------------------------------------------------------- grants
revoke execute on function
  public.monthly_totals(date, date),
  public.daily_totals(date, date),
  public.category_totals(date, date, public.transaction_type),
  public.transaction_totals(text, public.transaction_type, uuid, uuid, boolean, date, date),
  public.budget_progress(date),
  public.process_due_recurring(date),
  public.adjust_goal_saved(uuid, numeric)
from public, anon;

grant execute on function
  public.monthly_totals(date, date),
  public.daily_totals(date, date),
  public.category_totals(date, date, public.transaction_type),
  public.transaction_totals(text, public.transaction_type, uuid, uuid, boolean, date, date),
  public.budget_progress(date),
  public.process_due_recurring(date),
  public.adjust_goal_saved(uuid, numeric)
to authenticated;

grant execute on function public.process_due_recurring(date) to service_role;
