-- expense-tracker — recurring budgets create sirius-do tasks
-- Run manually in Supabase Dashboard → SQL Editor, after supabase-budgets.sql
-- and sirius-do's supabase-setup.sql (needs public.do_tasks). Safe to re-run.

alter table public.ex_budgets
  add column if not exists create_tasks boolean not null default false;

-- One row per budget payment date; task_id goes null when the task is deleted
-- in sirius-do, which also stops it from being recreated.
create table if not exists public.ex_budget_tasks (
  id          uuid         primary key default gen_random_uuid(),
  budget_id   uuid         not null references public.ex_budgets(id) on delete cascade,
  user_id     uuid         not null default auth.uid() references auth.users(id) on delete cascade,
  due_date    date         not null,
  task_id     uuid         references public.do_tasks(id) on delete set null,
  created_at  timestamptz  not null default now(),

  constraint budget_tasks_one_per_date unique (budget_id, due_date)
);

alter table public.ex_budget_tasks enable row level security;

drop policy if exists "budget_tasks_select_own" on public.ex_budget_tasks;
create policy "budget_tasks_select_own" on public.ex_budget_tasks
  for select using (auth.uid() = user_id);
drop policy if exists "budget_tasks_insert_own" on public.ex_budget_tasks;
create policy "budget_tasks_insert_own" on public.ex_budget_tasks
  for insert with check (auth.uid() = user_id);
drop policy if exists "budget_tasks_update_own" on public.ex_budget_tasks;
create policy "budget_tasks_update_own" on public.ex_budget_tasks
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "budget_tasks_delete_own" on public.ex_budget_tasks;
create policy "budget_tasks_delete_own" on public.ex_budget_tasks
  for delete using (auth.uid() = user_id);

notify pgrst, 'reload schema';
