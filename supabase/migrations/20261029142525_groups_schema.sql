-- Split expenses: groups, members, splits (one shared expense) and split_shares
-- (what each member owes for it). Members may be app users (user_id) or
-- placeholder people identified only by display_name.

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index groups_created_by_idx on public.groups (created_by);

create trigger groups_set_updated_at
  before update on public.groups
  for each row execute function private.set_updated_at();

create table public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  display_name text not null check (char_length(display_name) between 1 and 60),
  created_at timestamptz not null default now(),
  unique (id, group_id),
  unique (group_id, user_id)
);

create index group_members_user_idx on public.group_members (user_id) where user_id is not null;

create table public.splits (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  paid_by_member_id uuid not null,
  description text not null check (char_length(description) between 1 and 200),
  amount numeric(12, 2) not null check (amount > 0),
  date date not null default current_date,
  -- Optional link to the payer's own transaction (visible only to its owner via RLS).
  transaction_id uuid references public.transactions (id) on delete set null,
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, group_id),
  foreign key (paid_by_member_id, group_id)
    references public.group_members (id, group_id) on delete restrict
);

create index splits_group_date_idx on public.splits (group_id, date desc);
create index splits_paid_by_idx on public.splits (paid_by_member_id);
create index splits_transaction_idx on public.splits (transaction_id) where transaction_id is not null;
create index splits_created_by_idx on public.splits (created_by);

create trigger splits_set_updated_at
  before update on public.splits
  for each row execute function private.set_updated_at();

create table public.split_shares (
  id uuid primary key default gen_random_uuid(),
  split_id uuid not null,
  group_id uuid not null,
  member_id uuid not null,
  amount numeric(12, 2) not null check (amount >= 0),
  settled_at timestamptz,
  unique (split_id, member_id),
  foreign key (split_id, group_id)
    references public.splits (id, group_id) on delete cascade,
  foreign key (member_id, group_id)
    references public.group_members (id, group_id) on delete restrict
);

create index split_shares_group_idx on public.split_shares (group_id);
create index split_shares_member_idx on public.split_shares (member_id, group_id);

-- ---------------------------------------------------------------- membership helpers
-- SECURITY DEFINER so RLS policies on group_members can call them without recursion.
-- Lives in the unexposed `private` schema, so it is not callable via the Data API.
create or replace function private.is_group_member(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.group_members m
    where m.group_id = p_group_id and m.user_id = (select auth.uid())
  );
$$;

create or replace function private.is_group_owner(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.groups g
    where g.id = p_group_id and g.created_by = (select auth.uid())
  );
$$;

create or replace function private.is_split_owner(p_split_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.splits s
    where s.id = p_split_id and s.created_by = (select auth.uid())
  );
$$;

revoke all on function private.is_group_member(uuid) from public, anon;
revoke all on function private.is_group_owner(uuid) from public, anon;
revoke all on function private.is_split_owner(uuid) from public, anon;
grant execute on function private.is_group_member(uuid) to authenticated;
grant execute on function private.is_group_owner(uuid) to authenticated;
grant execute on function private.is_split_owner(uuid) to authenticated;

-- The creator automatically becomes the first member.
create or replace function private.groups_add_creator()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.group_members (group_id, user_id, display_name)
  select new.id, new.created_by, coalesce(nullif(p.full_name, ''), 'Me')
  from (select 1) as one
  left join public.profiles p on p.id = new.created_by;
  return new;
end;
$$;

create trigger groups_add_creator
  after insert on public.groups
  for each row execute function private.groups_add_creator();
