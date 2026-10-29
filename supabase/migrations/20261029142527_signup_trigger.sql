-- On signup: create the profile, seed default categories and a Cash account.

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'), 100),
    new.raw_user_meta_data ->> 'avatar_url'
  );

  insert into public.categories (user_id, name, type, icon, color, is_default)
  values
    (new.id, 'Food & Dining',      'expense', 'utensils',       '#f97316', true),
    (new.id, 'Groceries',          'expense', 'shopping-cart',  '#84cc16', true),
    (new.id, 'Transport',          'expense', 'car',            '#0ea5e9', true),
    (new.id, 'Shopping',           'expense', 'shopping-bag',   '#ec4899', true),
    (new.id, 'Bills & Utilities',  'expense', 'receipt',        '#eab308', true),
    (new.id, 'Rent',               'expense', 'house',          '#8b5cf6', true),
    (new.id, 'Entertainment',      'expense', 'film',           '#f43f5e', true),
    (new.id, 'Health',             'expense', 'heart-pulse',    '#ef4444', true),
    (new.id, 'Education',          'expense', 'graduation-cap', '#6366f1', true),
    (new.id, 'Travel',             'expense', 'plane',          '#14b8a6', true),
    (new.id, 'Personal Care',      'expense', 'sparkles',       '#d946ef', true),
    (new.id, 'Subscriptions',      'expense', 'repeat',         '#a855f7', true),
    (new.id, 'Gifts & Donations',  'expense', 'gift',           '#f59e0b', true),
    (new.id, 'Other',              'expense', 'circle-ellipsis','#64748b', true),
    (new.id, 'Salary',             'income',  'briefcase',      '#10b981', true),
    (new.id, 'Freelance',          'income',  'laptop',         '#22c55e', true),
    (new.id, 'Investments',        'income',  'trending-up',    '#06b6d4', true),
    (new.id, 'Refunds',            'income',  'rotate-ccw',     '#3b82f6', true),
    (new.id, 'Other Income',       'income',  'circle-plus',    '#64748b', true);

  insert into public.accounts (user_id, name, type, color)
  values (new.id, 'Cash', 'cash', '#10b981');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();
