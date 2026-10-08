-- Sirius fit: exercises, workouts (planned and done), sets, body metrics.
-- A workout is planned until marked completed, so one table serves both the
-- daily plan and the history.

create type public.fit_exercise_kind as enum ('strength', 'cardio', 'mobility');
create type public.fit_workout_status as enum ('planned', 'completed', 'skipped');

create table public.fit_exercises (
  id            uuid                     primary key default gen_random_uuid(),
  user_id       uuid                     not null default auth.uid() references auth.users(id) on delete cascade,
  name          text                     not null check (length(trim(name)) > 0),
  kind          public.fit_exercise_kind not null default 'strength',
  muscle_group  text,
  created_at    timestamptz              not null default now(),
  unique (user_id, name),
  unique (id, user_id)
);

create table public.fit_workouts (
  id            uuid                      primary key default gen_random_uuid(),
  user_id       uuid                      not null default auth.uid() references auth.users(id) on delete cascade,
  title         text                      not null check (length(trim(title)) > 0),
  scheduled_on  date                      not null,
  status        public.fit_workout_status not null default 'planned',
  started_at    timestamptz,
  ended_at      timestamptz,
  notes         text,
  created_at    timestamptz               not null default now(),
  updated_at    timestamptz               not null default now(),
  unique (id, user_id),
  check (ended_at is null or started_at is null or ended_at >= started_at)
);

create index fit_workouts_user_day_idx on public.fit_workouts (user_id, scheduled_on);

create table public.fit_workout_exercises (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null default auth.uid() references auth.users(id) on delete cascade,
  workout_id   uuid        not null,
  exercise_id  uuid        not null,
  position     integer     not null default 0,
  notes        text,
  created_at   timestamptz not null default now(),
  unique (id, user_id),
  foreign key (workout_id, user_id)
    references public.fit_workouts (id, user_id) on delete cascade,
  foreign key (exercise_id, user_id)
    references public.fit_exercises (id, user_id) on delete restrict
);

create index fit_workout_exercises_workout_idx on public.fit_workout_exercises (workout_id);

create table public.fit_sets (
  id                   uuid         primary key default gen_random_uuid(),
  user_id              uuid         not null default auth.uid() references auth.users(id) on delete cascade,
  workout_exercise_id  uuid         not null,
  position             integer      not null default 0,
  reps                 integer      check (reps >= 0),
  weight_kg            numeric(6,2) check (weight_kg >= 0),
  duration_seconds     integer      check (duration_seconds >= 0),
  distance_m           numeric(8,1) check (distance_m >= 0),
  rpe                  numeric(3,1) check (rpe between 1 and 10),
  is_warmup            boolean      not null default false,
  created_at           timestamptz  not null default now(),
  foreign key (workout_exercise_id, user_id)
    references public.fit_workout_exercises (id, user_id) on delete cascade
);

create index fit_sets_workout_exercise_idx on public.fit_sets (workout_exercise_id);

create table public.fit_body_metrics (
  id            uuid         primary key default gen_random_uuid(),
  user_id       uuid         not null default auth.uid() references auth.users(id) on delete cascade,
  measured_on   date         not null,
  weight_kg     numeric(5,2) check (weight_kg > 0),
  body_fat_pct  numeric(4,1) check (body_fat_pct between 0 and 100),
  waist_cm      numeric(5,1),
  chest_cm      numeric(5,1),
  hips_cm       numeric(5,1),
  arm_cm        numeric(5,1),
  thigh_cm      numeric(5,1),
  notes         text,
  created_at    timestamptz  not null default now(),
  unique (user_id, measured_on)
);

create trigger fit_workouts_set_updated_at before update on public.fit_workouts
  for each row execute function public.set_updated_at();

-- Best working set per exercise, ranked by Epley estimated 1RM.
create or replace view public.fit_personal_records
with (security_invoker = true) as
select distinct on (s.user_id, we.exercise_id)
  s.user_id,
  we.exercise_id,
  e.name                                    as exercise_name,
  s.weight_kg,
  s.reps,
  round(s.weight_kg * (1 + s.reps / 30.0), 1) as estimated_1rm,
  w.scheduled_on                            as achieved_on
from public.fit_sets s
join public.fit_workout_exercises we on we.id = s.workout_exercise_id
join public.fit_workouts w on w.id = we.workout_id
join public.fit_exercises e on e.id = we.exercise_id
where w.status = 'completed'
  and not s.is_warmup
  and s.weight_kg > 0
  and s.reps > 0
order by s.user_id, we.exercise_id, estimated_1rm desc, w.scheduled_on asc;

alter table public.fit_exercises         enable row level security;
alter table public.fit_workouts          enable row level security;
alter table public.fit_workout_exercises enable row level security;
alter table public.fit_sets              enable row level security;
alter table public.fit_body_metrics      enable row level security;

create policy "fit_exercises_own" on public.fit_exercises for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "fit_workouts_own" on public.fit_workouts for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "fit_workout_exercises_own" on public.fit_workout_exercises for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "fit_sets_own" on public.fit_sets for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "fit_body_metrics_own" on public.fit_body_metrics for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
