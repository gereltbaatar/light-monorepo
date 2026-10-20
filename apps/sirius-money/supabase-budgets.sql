-- expense-tracker — budgets: recurring bills and category spending limits
-- Run manually in Supabase Dashboard → SQL Editor, after supabase-schema.sql
-- (reuses public.set_updated_at()). Safe to re-run.

create table if not exists public.ex_budgets (
  id                  uuid            primary key default gen_random_uuid(),
  user_id             uuid            not null references auth.users(id) on delete cascade,
  kind                text            not null,
  title               text,
  icon                text,
  category            text,
  amount              numeric(14, 2)  not null,
  currency            text            not null default 'MNT',
  amount_mnt          numeric(14, 2)  not null,
  period              text            not null default 'monthly',
  due_date            date,
  remind_days_before  smallint        not null default 0,
  auto_repeat         boolean         not null default false,
  warning_percent     smallint,
  created_at          timestamptz     not null default now(),
  updated_at          timestamptz     not null default now(),

  constraint budgets_kind_valid check (kind in ('recurring', 'limit')),
  constraint budgets_period_valid check (period in ('weekly', 'monthly', 'yearly')),
  constraint budgets_amount_positive check (amount > 0 and amount_mnt > 0),
  constraint budgets_currency_valid check (currency ~ '^[A-Z]{3}$'),
  constraint budgets_remind_range check (remind_days_before between 0 and 10),
  constraint budgets_warning_range check (warning_percent is null or warning_percent between 1 and 100),
  constraint budgets_recurring_complete check (
    kind <> 'recurring' or length(btrim(coalesce(title, ''))) > 0
  ),
  constraint budgets_limit_complete check (
    kind <> 'limit' or (category is not null and warning_percent is not null)
  )
);

comment on column public.ex_budgets.amount is 'In `currency`; amount_mnt is the tugrik value at the Mongolbank rate on creation.';

create index if not exists budgets_user_created_idx
  on public.ex_budgets (user_id, created_at desc);

drop trigger if exists budgets_set_updated_at on public.ex_budgets;
create trigger budgets_set_updated_at
  before update on public.ex_budgets
  for each row execute function public.set_updated_at();

alter table public.ex_budgets enable row level security;

drop policy if exists "budgets_select_own" on public.ex_budgets;
create policy "budgets_select_own" on public.ex_budgets
  for select using (auth.uid() = user_id);
drop policy if exists "budgets_insert_own" on public.ex_budgets;
create policy "budgets_insert_own" on public.ex_budgets
  for insert with check (auth.uid() = user_id);
drop policy if exists "budgets_update_own" on public.ex_budgets;
create policy "budgets_update_own" on public.ex_budgets
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "budgets_delete_own" on public.ex_budgets;
create policy "budgets_delete_own" on public.ex_budgets
  for delete using (auth.uid() = user_id);

notify pgrst, 'reload schema';
