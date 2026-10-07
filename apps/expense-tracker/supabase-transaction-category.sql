-- expense-tracker — category on transactions
-- Run manually in Supabase Dashboard → SQL Editor, after supabase-transactions.sql.
-- Safe to re-run.

alter table public.transactions
  add column if not exists category text not null default 'other';

alter table public.transactions
  drop constraint if exists transactions_category_valid;

alter table public.transactions
  add constraint transactions_category_valid check (category in (
    'food', 'coffee', 'shopping', 'taxi', 'entertainment',
    'bills', 'health', 'salary', 'gift', 'other'
  ));

comment on column public.transactions.category is
  'Fixed category key; the list is mirrored in src/lib/categories.ts.';

notify pgrst, 'reload schema';
