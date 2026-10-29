-- Recurring rules, budgets, savings goals.

-- ---------------------------------------------------------------- recurring_rules
create table public.recurring_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  type public.transaction_type not null,
  amount numeric(12, 2) not null check (amount > 0),
  account_id uuid not null,
  to_account_id uuid,
  category_id uuid,
  description text check (char_length(description) <= 200),
  frequency public.recurrence_frequency not null,
  interval_count smallint not null default 1 check (interval_count between 1 and 365),
  start_date date not null default current_date,
  next_run_date date not null,
  end_date date,
  is_active boolean not null default true,
  last_run_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (account_id, user_id)
    references public.accounts (id, user_id) on delete cascade,
  foreign key (to_account_id, user_id)
    references public.accounts (id, user_id) on delete cascade,
  foreign key (category_id, user_id)
    references public.categories (id, user_id) on delete set null (category_id),
  constraint recurring_rules_transfer_shape check (
    (type = 'transfer' and to_account_id is not null and to_account_id <> account_id and category_id is null)
    or (type <> 'transfer' and to_account_id is null)
  ),
  constraint recurring_rules_dates check (end_date is null or end_date >= start_date)
);

create index recurring_rules_user_idx on public.recurring_rules (user_id);
create index recurring_rules_due_idx on public.recurring_rules (next_run_date) where is_active;
create index recurring_rules_account_idx on public.recurring_rules (account_id);
create index recurring_rules_to_account_idx on public.recurring_rules (to_account_id) where to_account_id is not null;
create index recurring_rules_category_idx on public.recurring_rules (category_id) where category_id is not null;

create trigger recurring_rules_set_updated_at
  before update on public.recurring_rules
  for each row execute function private.set_updated_at();

alter table public.transactions
  add constraint transactions_recurring_rule_fkey
  foreign key (recurring_rule_id, user_id)
  references public.recurring_rules (id, user_id) on delete set null (recurring_rule_id);

create index transactions_recurring_rule_idx on public.transactions (recurring_rule_id)
  where recurring_rule_id is not null;

-- ---------------------------------------------------------------- budgets
-- One monthly limit per category; applies to every calendar month.
create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  category_id uuid not null,
  amount numeric(12, 2) not null check (amount > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, category_id),
  foreign key (category_id, user_id)
    references public.categories (id, user_id) on delete cascade
);

create index budgets_category_idx on public.budgets (category_id);

create trigger budgets_set_updated_at
  before update on public.budgets
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------- savings_goals
create table public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  target_amount numeric(12, 2) not null check (target_amount > 0),
  saved_amount numeric(12, 2) not null default 0 check (saved_amount >= 0),
  deadline date,
  icon text not null default 'piggy-bank' check (icon ~ '^[a-z0-9-]{1,40}$'),
  color text not null default '#10b981' check (color ~ '^#[0-9a-fA-F]{6}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index savings_goals_user_idx on public.savings_goals (user_id);

create trigger savings_goals_set_updated_at
  before update on public.savings_goals
  for each row execute function private.set_updated_at();
