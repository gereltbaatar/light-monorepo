-- Sirius Do: task categories. Paste into the Supabase SQL Editor after supabase-setup.sql.
-- Default categories carry a `key` and are named by the app; custom ones carry a `name`.

begin;

create table if not exists public.do_categories (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null default auth.uid() references auth.users(id) on delete cascade,
  key         text,
  name        text,
  icon        text        not null default 'tag',
  color       text        not null default '#64748b',
  position    integer     not null default 0,
  created_at  timestamptz not null default now(),
  constraint do_categories_named check (key is not null or length(trim(name)) > 0),
  unique (user_id, key),
  unique (id, user_id)
);

create index if not exists do_categories_user_idx on public.do_categories (user_id, position);

alter table public.do_categories enable row level security;

drop policy if exists "do_categories_select" on public.do_categories;
drop policy if exists "do_categories_insert" on public.do_categories;
drop policy if exists "do_categories_update" on public.do_categories;
drop policy if exists "do_categories_delete" on public.do_categories;

create policy "do_categories_select" on public.do_categories for select to authenticated
  using (user_id = (select auth.uid()));
create policy "do_categories_insert" on public.do_categories for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "do_categories_update" on public.do_categories for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
-- Defaults are re-seeded when missing, so only custom ones can be deleted.
create policy "do_categories_delete" on public.do_categories for delete to authenticated
  using (user_id = (select auth.uid()) and key is null);

-- The composite key stops a task from pointing at another user's category.
alter table public.do_tasks add column if not exists category_id uuid;
alter table public.do_tasks drop constraint if exists do_tasks_category_fk;
alter table public.do_tasks
  add constraint do_tasks_category_fk foreign key (category_id, user_id)
  references public.do_categories (id, user_id) on delete set null (category_id);

create index if not exists do_tasks_category_idx on public.do_tasks (user_id, category_id);

commit;
