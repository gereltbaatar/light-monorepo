-- expense-tracker — prefix every expense table with ex_ so it stands apart
-- from the other Sirius apps sharing this project. profiles stays shared.
-- Run once in Supabase Dashboard → SQL Editor. Views, FKs, triggers, indexes
-- and policies follow a rename automatically.

begin;

alter table if exists public.transactions       rename to ex_transactions;
alter table if exists public.goals              rename to ex_goals;
alter table if exists public.goal_contributions rename to ex_goal_contributions;
alter table if exists public.ai_usage           rename to ex_ai_usage;
alter view  if exists public.goal_progress      rename to ex_goal_progress;

commit;

notify pgrst, 'reload schema';
