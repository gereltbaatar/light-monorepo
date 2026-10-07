-- expense-tracker — goals and goal contributions
-- Run manually in Supabase Dashboard → SQL Editor, after supabase-schema.sql
-- (reuses public.set_updated_at()).

-- 1. Types -----------------------------------------------------------------

create type public.goal_kind as enum ('savings', 'plan');
create type public.goal_category as enum ('general', 'travel', 'gadget', 'home', 'emergency');
create type public.goal_period as enum ('weekly', 'monthly', 'yearly');
create type public.goal_status as enum ('active', 'completed', 'archived');
create type public.contribution_direction as enum ('deposit', 'withdrawal');

-- 2. Goals -----------------------------------------------------------------

create table public.goals (
  id                   uuid                  primary key default gen_random_uuid(),
  user_id              uuid                  not null references auth.users(id) on delete cascade,
  kind                 public.goal_kind      not null,
  title                text                  not null,
  image_url            text,
  target_amount        numeric(14, 2)        not null,
  category             public.goal_category  not null default 'general',
  target_date          date,
  contribution_amount  numeric(14, 2),
  contribution_period  public.goal_period,
  start_date           date,
  auto_contribute      boolean               not null default false,
  remind_on_due        boolean               not null default false,
  remind_on_milestone  boolean               not null default false,
  status               public.goal_status    not null default 'active',
  completed_at         timestamptz,
  created_at           timestamptz           not null default now(),
  updated_at           timestamptz           not null default now(),

  constraint goals_target_positive check (target_amount > 0),
  constraint goals_title_not_blank check (length(btrim(title)) > 0),
  constraint goals_contribution_positive check (contribution_amount is null or contribution_amount > 0),
  constraint goals_plan_complete check (
    kind <> 'plan'
    or (contribution_amount is not null and contribution_period is not null and start_date is not null)
  )
);

create index goals_user_status_idx on public.goals (user_id, status, created_at desc);

create trigger goals_set_updated_at
  before update on public.goals
  for each row execute function public.set_updated_at();

-- 3. Contributions ---------------------------------------------------------

create table public.goal_contributions (
  id              uuid                           primary key default gen_random_uuid(),
  goal_id         uuid                           not null references public.goals(id) on delete cascade,
  user_id         uuid                           not null references auth.users(id) on delete cascade,
  amount          numeric(14, 2)                 not null,
  direction       public.contribution_direction  not null default 'deposit',
  contributed_on  date                           not null default current_date,
  note            text,
  created_at      timestamptz                    not null default now(),

  constraint goal_contributions_amount_positive check (amount > 0)
);

create index goal_contributions_goal_idx
  on public.goal_contributions (goal_id, contributed_on desc, created_at desc);

-- 4. Progress view ---------------------------------------------------------

-- security_invoker makes the view obey the caller's RLS instead of the owner's.
create view public.goal_progress
with (security_invoker = true) as
select
  g.*,
  coalesce(sum(case when c.direction = 'deposit' then c.amount else -c.amount end), 0)::numeric(14, 2) as saved_amount
from public.goals g
left join public.goal_contributions c on c.goal_id = g.id
group by g.id;

-- 5. Row Level Security ----------------------------------------------------

alter table public.goals enable row level security;
alter table public.goal_contributions enable row level security;

create policy "goals_select_own" on public.goals
  for select using (auth.uid() = user_id);
create policy "goals_insert_own" on public.goals
  for insert with check (auth.uid() = user_id);
create policy "goals_update_own" on public.goals
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "goals_delete_own" on public.goals
  for delete using (auth.uid() = user_id);

create policy "goal_contributions_select_own" on public.goal_contributions
  for select using (auth.uid() = user_id);

-- The goal must also belong to the caller, or a row could be attached to someone else's goal.
create policy "goal_contributions_insert_own" on public.goal_contributions
  for insert with check (
    auth.uid() = user_id
    and exists (select 1 from public.goals g where g.id = goal_id and g.user_id = auth.uid())
  );
create policy "goal_contributions_delete_own" on public.goal_contributions
  for delete using (auth.uid() = user_id);

notify pgrst, 'reload schema';
