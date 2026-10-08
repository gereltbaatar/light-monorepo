-- Sirius Do: simple task tracker. Paste into the Supabase SQL Editor.
-- Safe on a fresh project and on one where the earlier full Sirius setup ran:
-- it drops the goals/habits/recurring/fit/life objects and reshapes do_tasks.
-- Needs sirius-money's supabase-schema.sql (profiles, set_updated_at).

begin;

-- Profile: "today" and the calendar's first weekday ---------------------------

alter table public.profiles
  add column if not exists timezone       text     not null default 'Asia/Ulaanbaatar',
  add column if not exists currency       text     not null default 'MNT',
  add column if not exists week_starts_on smallint not null default 1;

alter table public.profiles
  drop constraint if exists profiles_week_starts_on_valid;

alter table public.profiles
  add constraint profiles_week_starts_on_valid check (week_starts_on between 0 and 6);

-- Remove what the simple tracker no longer uses -------------------------------

drop view if exists public.life_calendar_items;
drop view if exists public.fit_personal_records;

do $$
begin
  if to_regclass('public.do_tasks') is not null then
    drop trigger if exists do_tasks_book_expense   on public.do_tasks;
    drop trigger if exists do_tasks_unbook_expense on public.do_tasks;
    drop trigger if exists do_tasks_plan_workout   on public.do_tasks;
    drop trigger if exists do_tasks_sync_workout   on public.do_tasks;
    drop trigger if exists do_tasks_drop_workout   on public.do_tasks;
    drop trigger if exists do_tasks_completed_at   on public.do_tasks;
  end if;
end;
$$;

drop function if exists public.do_tasks_book_expense();
drop function if exists public.do_tasks_unbook_expense();
drop function if exists public.do_tasks_plan_workout();
drop function if exists public.do_tasks_sync_workout();
drop function if exists public.do_tasks_drop_workout();
drop function if exists public.fit_workouts_sync_tasks() cascade;

do $$
begin
  if to_regclass('public.do_tasks') is not null then
    alter table public.do_tasks
      drop column if exists category_id,
      drop column if exists series_id,
      drop column if exists occurrence_date,
      drop column if exists position,
      drop column if exists project_id,
      drop column if exists habit_id,
      drop column if exists is_workout,
      drop column if exists workout_id,
      drop column if exists money_amount,
      drop column if exists money_category,
      drop column if exists transaction_id;
  end if;
end;
$$;

drop table if exists public.do_series;
drop table if exists public.do_habit_logs;
drop table if exists public.do_habits;
drop table if exists public.do_projects;
drop table if exists public.do_goals;
drop table if exists public.do_inbox;
drop table if exists public.do_events;
drop table if exists public.do_categories;

drop table if exists public.fit_sets;
drop table if exists public.fit_workout_exercises;
drop table if exists public.fit_body_metrics;
drop table if exists public.fit_exercises;
drop table if exists public.fit_workouts;

drop function if exists public.do_task_to_workout_status(public.do_task_status);
drop function if exists public.fit_workout_to_task_status(public.fit_workout_status);

-- Tasks -------------------------------------------------------------------------

create table if not exists public.do_tasks (
  id                uuid        primary key default gen_random_uuid(),
  user_id           uuid        not null default auth.uid() references auth.users(id) on delete cascade,
  title             text        not null check (length(trim(title)) > 0),
  notes             text,
  status            text        not null default 'todo',
  priority          text        not null default 'medium',
  due_date          date,
  due_time          time,
  duration_minutes  integer     check (duration_minutes > 0),
  completed_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table public.do_tasks add column if not exists duration_minutes integer check (duration_minutes > 0);

drop index if exists public.do_tasks_user_open_idx;
drop index if exists public.do_tasks_user_completed_idx;

-- Cancelled rows were deleted occurrences of recurring tasks.
delete from public.do_tasks where status::text = 'cancelled';
update public.do_tasks set status = 'todo' where status::text = 'in_progress';

alter table public.do_tasks
  alter column status drop default,
  alter column status type text using status::text,
  alter column status set default 'todo',
  alter column priority drop default,
  alter column priority type text using priority::text,
  alter column priority set default 'medium';

alter table public.do_tasks drop constraint if exists do_tasks_status_valid;
alter table public.do_tasks drop constraint if exists do_tasks_priority_valid;
alter table public.do_tasks
  add constraint do_tasks_status_valid check (status in ('todo', 'done')),
  add constraint do_tasks_priority_valid check (priority in ('low', 'medium', 'high', 'urgent'));

drop type if exists public.do_task_status;
drop type if exists public.do_task_priority;
drop type if exists public.fit_workout_status;
drop type if exists public.fit_exercise_kind;

create index if not exists do_tasks_user_due_idx on public.do_tasks (user_id, due_date);
create index do_tasks_user_open_idx on public.do_tasks (user_id, due_date) where status = 'todo';

-- Keeps completed_at truthful whichever client flips the status.
create or replace function public.do_tasks_sync_completed_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'done' then
    new.completed_at = coalesce(new.completed_at, now());
  else
    new.completed_at = null;
  end if;
  return new;
end;
$$;

create trigger do_tasks_completed_at
  before insert or update of status on public.do_tasks
  for each row execute function public.do_tasks_sync_completed_at();

drop trigger if exists do_tasks_set_updated_at on public.do_tasks;
create trigger do_tasks_set_updated_at before update on public.do_tasks
  for each row execute function public.set_updated_at();

alter table public.do_tasks enable row level security;

drop policy if exists "do_tasks_own" on public.do_tasks;
create policy "do_tasks_own" on public.do_tasks for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

commit;

notify pgrst, 'reload schema';
