-- Row Level Security on every table. Users see only their own rows; group data
-- is visible to group members. `(select auth.uid())` is wrapped so Postgres
-- evaluates it once per statement instead of once per row.

-- Explicit grants: authenticated users go through RLS, anon gets nothing.
revoke all on all tables in schema public from anon;
grant select, insert, update, delete on all tables in schema public to authenticated;

alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.recurring_rules enable row level security;
alter table public.budgets enable row level security;
alter table public.savings_goals enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.splits enable row level security;
alter table public.split_shares enable row level security;

-- ---------------------------------------------------------------- profiles
-- Rows are created by the signup trigger; users can read/update only their own.
create policy "profiles: select own" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "profiles: update own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- ---------------------------------------------------------------- user-owned tables
do $$
declare
  t text;
begin
  foreach t in array array[
    'accounts', 'categories', 'transactions', 'recurring_rules', 'budgets', 'savings_goals'
  ] loop
    execute format(
      'create policy "%1$s: select own" on public.%1$I for select to authenticated
         using (user_id = (select auth.uid()))', t);
    execute format(
      'create policy "%1$s: insert own" on public.%1$I for insert to authenticated
         with check (user_id = (select auth.uid()))', t);
    execute format(
      'create policy "%1$s: update own" on public.%1$I for update to authenticated
         using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t);
    execute format(
      'create policy "%1$s: delete own" on public.%1$I for delete to authenticated
         using (user_id = (select auth.uid()))', t);
  end loop;
end;
$$;

-- ---------------------------------------------------------------- groups
create policy "groups: select as member" on public.groups
  for select to authenticated
  using (created_by = (select auth.uid()) or private.is_group_member(id));
create policy "groups: insert as creator" on public.groups
  for insert to authenticated with check (created_by = (select auth.uid()));
create policy "groups: update as owner" on public.groups
  for update to authenticated
  using (created_by = (select auth.uid())) with check (created_by = (select auth.uid()));
create policy "groups: delete as owner" on public.groups
  for delete to authenticated using (created_by = (select auth.uid()));

-- ---------------------------------------------------------------- group_members
create policy "group_members: select as member" on public.group_members
  for select to authenticated
  using (private.is_group_member(group_id) or private.is_group_owner(group_id));
create policy "group_members: insert as owner" on public.group_members
  for insert to authenticated with check (private.is_group_owner(group_id));
create policy "group_members: update as owner" on public.group_members
  for update to authenticated
  using (private.is_group_owner(group_id)) with check (private.is_group_owner(group_id));
create policy "group_members: delete as owner or self" on public.group_members
  for delete to authenticated
  using (private.is_group_owner(group_id) or user_id = (select auth.uid()));

-- ---------------------------------------------------------------- splits
create policy "splits: select as member" on public.splits
  for select to authenticated using (private.is_group_member(group_id));
create policy "splits: insert as member" on public.splits
  for insert to authenticated
  with check (created_by = (select auth.uid()) and private.is_group_member(group_id));
create policy "splits: update as creator" on public.splits
  for update to authenticated
  using (created_by = (select auth.uid()))
  with check (created_by = (select auth.uid()) and private.is_group_member(group_id));
create policy "splits: delete as creator" on public.splits
  for delete to authenticated using (created_by = (select auth.uid()));

-- ---------------------------------------------------------------- split_shares
create policy "split_shares: select as member" on public.split_shares
  for select to authenticated using (private.is_group_member(group_id));
create policy "split_shares: insert as split creator" on public.split_shares
  for insert to authenticated with check (private.is_split_owner(split_id));
-- The split creator manages shares; a member may also settle their own share.
create policy "split_shares: update as split creator or own share" on public.split_shares
  for update to authenticated
  using (
    private.is_split_owner(split_id)
    or member_id in (select m.id from public.group_members m where m.user_id = (select auth.uid()))
  )
  with check (private.is_group_member(group_id));
create policy "split_shares: delete as split creator" on public.split_shares
  for delete to authenticated using (private.is_split_owner(split_id));
