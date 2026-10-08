-- Sirius do: tasks, recurring series (incl. routines) and calendar events.
-- Every table carries user_id; child rows use composite FKs on (id, user_id)
-- so a row can never point at another user's data.

create type public.do_task_status as enum ('todo', 'in_progress', 'done', 'cancelled');
create type public.do_task_priority as enum ('low', 'medium', 'high', 'urgent');

create table public.do_categories (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null default auth.uid() references auth.users(id) on delete cascade,
  name        text        not null check (length(trim(name)) > 0),
  color       text,
  position    integer     not null default 0,
  created_at  timestamptz not null default now(),
  unique (user_id, name),
  unique (id, user_id)
);

-- A repeating task or routine; its occurrences are rows in do_tasks.
create table public.do_series (
  id           uuid                    primary key default gen_random_uuid(),
  user_id      uuid                    not null default auth.uid() references auth.users(id) on delete cascade,
  category_id  uuid,
  title        text                    not null check (length(trim(title)) > 0),
  notes        text,
  priority     public.do_task_priority not null default 'medium',
  is_routine   boolean                 not null default false,
  rrule        text                    not null check (rrule ~ '^FREQ=(DAILY|WEEKLY|MONTHLY|YEARLY)'),
  starts_on    date                    not null,
  ends_on      date                    check (ends_on is null or ends_on >= starts_on),
  due_time     time,
  active       boolean                 not null default true,
  created_at   timestamptz             not null default now(),
  updated_at   timestamptz             not null default now(),
  unique (id, user_id),
  foreign key (category_id, user_id)
    references public.do_categories (id, user_id) on delete set null (category_id)
);

comment on column public.do_series.rrule is 'RFC 5545 subset, e.g. FREQ=WEEKLY;INTERVAL=1;BYDAY=MO,WE,FR.';

create table public.do_tasks (
  id               uuid                    primary key default gen_random_uuid(),
  user_id          uuid                    not null default auth.uid() references auth.users(id) on delete cascade,
  category_id      uuid,
  series_id        uuid,
  occurrence_date  date,
  title            text                    not null check (length(trim(title)) > 0),
  notes            text,
  status           public.do_task_status   not null default 'todo',
  priority         public.do_task_priority not null default 'medium',
  due_date         date,
  due_time         time,
  completed_at     timestamptz,
  position         integer                 not null default 0,
  created_at       timestamptz             not null default now(),
  updated_at       timestamptz             not null default now(),
  unique (series_id, occurrence_date),
  foreign key (category_id, user_id)
    references public.do_categories (id, user_id) on delete set null (category_id),
  foreign key (series_id, user_id)
    references public.do_series (id, user_id) on delete set null (series_id)
);

comment on column public.do_tasks.occurrence_date is 'The series date this row materializes; unique per series so generation is idempotent.';

create index do_tasks_user_due_idx on public.do_tasks (user_id, due_date);
create index do_tasks_user_open_idx on public.do_tasks (user_id, due_date)
  where status in ('todo', 'in_progress');

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

create table public.do_events (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null default auth.uid() references auth.users(id) on delete cascade,
  title       text        not null check (length(trim(title)) > 0),
  notes       text,
  location    text,
  starts_at   timestamptz not null,
  ends_at     timestamptz not null,
  all_day     boolean     not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  check (ends_at >= starts_at)
);

create index do_events_user_starts_idx on public.do_events (user_id, starts_at);

create trigger do_series_set_updated_at before update on public.do_series
  for each row execute function public.set_updated_at();
create trigger do_tasks_set_updated_at before update on public.do_tasks
  for each row execute function public.set_updated_at();
create trigger do_events_set_updated_at before update on public.do_events
  for each row execute function public.set_updated_at();

alter table public.do_categories enable row level security;
alter table public.do_series     enable row level security;
alter table public.do_tasks      enable row level security;
alter table public.do_events     enable row level security;

create policy "do_categories_own" on public.do_categories for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "do_series_own" on public.do_series for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "do_tasks_own" on public.do_tasks for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "do_events_own" on public.do_events for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
