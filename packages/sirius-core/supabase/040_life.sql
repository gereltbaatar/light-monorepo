-- Sirius life: one timeline across domains for every calendar view.
-- security_invoker makes the view obey each source table's RLS.

create or replace view public.life_calendar_items
with (security_invoker = true) as
select
  'task'::text          as kind,
  t.id,
  t.user_id,
  t.title,
  t.due_date            as day,
  t.due_time            as at_time,
  (t.status = 'done')   as done
from public.do_tasks t
where t.due_date is not null
  and t.status <> 'cancelled'

union all

select
  'event'::text,
  e.id,
  e.user_id,
  e.title,
  (e.starts_at at time zone p.timezone)::date,
  case when e.all_day then null else (e.starts_at at time zone p.timezone)::time end,
  (e.ends_at < now())
from public.do_events e
join public.profiles p on p.id = e.user_id

union all

select
  'workout'::text,
  w.id,
  w.user_id,
  w.title,
  w.scheduled_on,
  (w.started_at at time zone p.timezone)::time,
  (w.status = 'completed')
from public.fit_workouts w
join public.profiles p on p.id = w.user_id
where w.status <> 'skipped';
